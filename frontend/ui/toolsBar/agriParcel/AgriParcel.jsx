import { React, PropTypes, elements } from 'perun-core';
import { core,  data, tools, ui, config as cfg } from '../../../Spatial';
import { config, createAPMsg, drawAPMsg, cutAPMsg, cutConfig, restAP, deleteAPMsg, fillConfig } from './Config';
import { Form } from './Form';
import { Guidance } from './Guidance';
import { saveAP } from './Save';

const { MIN_DIGI_SCALE, MAP_CONFIG } = cfg;
const { Map, store, factory, http, util } = core;
const { geobuf, protobuf } = data;
const { draw: { polygon, line }, edit } = tools;
const { ButtonGroup, Divider, Button, Icon, DrawActions, Modal } = ui
const { useReducer } = React;

const _layerGroup = factory.layerGroup();
const _id = ['createAP', 'drawAP', 'editAP', 'splitAP', 'mergeAP', 'cutAP', 'fillAP', 'assignAP', 'deleteAP'];
const _style = { color: '#eed000', fillColor: '#FFFFFF' };

const _AgriParcel = ({processID, farmObjId}) => {
    const [{layer, data, isGuided}, setState] = useReducer((currState, update) => 
        ({...currState, ...update}), 
        { layer: {}, data: {}, isGuided: false });

    const enable = (id, fn) => {
        store.dispatch({ processID: id, minZoom: MIN_DIGI_SCALE });
        setState({isGuided: true})
        fn && fn();
    };

    const disable = (fn) => {
        // Reset state, internal and application-wide.
        setState({ layer: {}, data: {}, isGuided: false });
        store.dispatch({processID: '', minZoom: MAP_CONFIG.minZoom});
        // We remove the working geometry, save process will add the result.
        layer.removeFrom && layer.removeFrom(Map);
        fn && fn();
    }

    const onChange = ({ formData }) => 
        setState({data: { ...data, ...formData }});

    const onSubmit = ({ formData }) => {
        saveAP(JSON.stringify({ 
            ...data, 
            ...formData,
            OBJECT_ID: (layer.feature && layer.feature.id && Number(layer.feature.id)) || 0,
            PARENT_ID: farmObjId || 0,
            GEOM: factory.GeoJSON.fromLayer(layer) }), disable);
    }

    const _createAP = () => {
        // Click handler for selection of location and creation of agri parcel geometry.
        Map.on('click', e => {
            const p = Map.transform(e.latlng);
            http.call('create_ap', {
                url: '/spatial/geometry/layer/cutoff/{init.token}/PHYSICAL_BLOCK/AGRI_PARCEL/' +p.x + '/' + p.y})
            .then(response => {
                const data = geobuf.decode(protobuf(response));
                const geojson = factory.geoJSON(data, config.pathOptions);
                const stateData = store.getState().data.layers;
        
                geojson.getLayers().forEach(layer => {
                    const id = layer.feature.id
        
                    // remove old app layers entries, will update with the new geojson set.
                    stateData[id] && stateData[id].removeFrom(Map);
        
                    // Flatten the geometry array, so utilities can read the thing. god knows why this happens.
                    layer.setLatLngs([ ...util.flattenDeep(layer.getLatLngs()) ])

                    // assign metadata
                    layer.feature.id = '0'
                    layer.feature.properties = {
                        AREA: layer.feature.properties.AREA,
                        CENTROID: layer.feature.properties.CENTROID,
                        GEOM: layer.feature.properties.GEOM,
                        LAND_COVER_CODE: layer.feature.properties.LAND_COVER_CODE,
                        PERIMETER: layer.feature.properties.PERIMETER,
                        parent_id: layer.feature.properties.parent_id,
                        DESCRIPTOR: 'AGRI_PARCEL'
                    }

                    layer.addTo(Map);
                    setState({data: layer.feature.properties, layer: layer, isGuided: false})
                })
            })
            .catch(err => console.log(err));

            Map.off('click');
        });
    }

    const _drawAP = () => {
        Map.on('new_shape', e => {
            (e && e.layer) 
                && (setState({layer: e.layer, isGuided: false}), e.layer.addTo(Map));
            Map.off('new_shape');
        });
        polygon.enable(config);
    }
    const _stopDrawAP = () => polygon.disable('force');


    const _editAP = () => {
        const currZoom = Map.getZoom();
        // This line ensures no racing codition on the current bounding box.
        // We set view manually before calling Map.getBBox in _fetchBlocks and bbox will NOT contain a whole country.
        Map.setView(Map.getCenter(), currZoom < MIN_DIGI_SCALE ? MIN_DIGI_SCALE: currZoom); // zoom is inverse to scale
        _layerGroup.addTo(Map);
    }
    const _stopEditAP = () => {
        _layerGroup.clearLayers().removeFrom(Map);
        edit.polygon.disable();
    }
    const _fetchBlocks = id => {
        http.call('render_pb', {
            url: '/spatial/geometry/get/bbox/{init.token}/AGRI_PARCEL/' + Map.getBBox(),
        })
        .then(response => _renderBlocks(id, geobuf.decode(protobuf(response))))
        .catch(err => console.log(err));
    }
    const _renderBlocks = (id, jsonArr) => {
        // filter layers, remove old app layers entries, will update with the new geojson set.
        const mapLayers = store.getState().data.layers;

        jsonArr.features.map(feature => {
            mapLayers[feature.id] && mapLayers[feature.id].removeFrom(Map);

            factory.geoJSON(feature, {
                onEachFeature: function (feature, layer) {
                    id === id[2] && _setBlockEvents(layer);
                    _layerGroup.addLayer(layer);
                },
                style: _style
            });
        })
    }
    const _setBlockEvents = layer => {
        layer.on('mouseover', function () { this.setStyle({ color: '#eed000',  fillColor: '#000000' })})
            .on('mouseout', function () { this.setStyle( _style )})
            .on('click', function () { initEdit(layer); })
    }
    const initEdit = layer => {
        layer.setStyle(_style)
        // disable all selection events on group. Remove edited layer from group.
        _layerGroup.eachLayer(el => el.off('mouseover mouseout click'));
        _layerGroup.removeLayer(layer);
        // re-add layer as standalone.
        layer.options.metadata = config.pathOptions.metadata;
        layer.addTo(Map);

        // Move map view on top of selected polygon.
        Map.fitBounds(layer.getBounds());

        // Activate edit handler on selected polygon
        edit.polygon.enable(_simplifyMultipolygon(layer), config);
        setState({layer: layer, data: layer.feature.properties, isGuided: false});

        // Activate edit event listeners on layer.
        layer.on('pm:edit', e =>  setState({layer: e.target, data: e.target.feature.properties}));
    }
    const _simplifyMultipolygon = layer => {
        let latlngArr = layer._latlngs
        let simpleLatlngArr = latlngArr[0];
        latlngArr.length = 0

        Object.keys(simpleLatlngArr).forEach(key => 
            latlngArr.push(simpleLatlngArr[key]));

        return layer;
    }

    const _splitAP = () => {
        Map.on('new_shape', e => {
            if (e && e.layer) {
                http.call(_id[3], {data: JSON.stringify(factory.GeoJSON.fromLayer(e.layer))})
                    .then(response => {
                        const geojson = factory.geoJSON(geobuf.decode(protobuf(response)), config.pathOptions);
                        const stateData = store.getState().data.layers;

                        geojson.getLayers().forEach(layer => {
                            const id = layer.feature.id
                
                            // remove old app layers entries, will update with the new geojson set.
                            stateData[id] && stateData[id].removeFrom(Map);
                
                            // Flatten the geometry array, so utilities can read the thing. god knows why this happens.
                            layer.setLatLngs([ ...util.flattenDeep(layer.getLatLngs()) ])
                            layer.addTo(Map);
                            e.layer.removeFrom(Map);
                        })

                        elements.alertUser(true, 
                            'success', 
                            'Успешно поделена земјоделска парцела', 
                            'Добиени се ' + geojson.getLayers().length + ' нови парцели.')                    
                    })
                    .catch(error => console.log(error))
            }

            disable()
            Map.off('new_shape');
        });

        line.enable(config);
    }
    const _mergeAP = () => {
        Map.on('new_shape', e => {
            if (e && e.layer) {
                http.call(_id[4], {data: JSON.stringify(factory.GeoJSON.fromLayer(e.layer))})
                    .then(response => {
                        const geojson = factory.geoJSON(geobuf.decode(protobuf(response)), config.pathOptions);

                        Map.eachLayer(function(layer) {
                            if (layer.toGeoJSON) {
                                Map.removeLayer(layer);
                            }
                        });

                        geojson.getLayers().forEach(layer => {
                            // Flatten the geometry array, so utilities can read the thing. god knows why this happens.
                            layer.setLatLngs([ ...util.flattenDeep(layer.getLatLngs()) ])
                            layer.addTo(Map);
                            e.layer.removeFrom(Map);
                        })

                        elements.alertUser(true, 'success', 'Успешно приспоени земјоделски парцели')                    
                    })
                    .catch(error => console.log(error))
            }

            disable()
            Map.off('new_shape');
        });
        line.enable(config);
    }
    const _stopLineAP = () => line.disable('force');

    const _cutAP = () => {
        const currZoom = Map.getZoom();
        // This line ensures no racing codition on the current bounding box.
        // We set view manually before calling Map.getBBox in _fetchBlocks and bbox will NOT contain a whole country.
        Map.setView(Map.getCenter(), currZoom < MIN_DIGI_SCALE ? MIN_DIGI_SCALE: currZoom); // zoom is inverse to scale
        Map.on('new_shape', e => _cutParcel(e));
        _layerGroup.addTo(Map);
        polygon.enable(util.assign(config, cutConfig));
        _fetchBlocks(_id[5])
    }
    const _cutParcel = e => {
        if (e && e.layer) {
            http.call(_id[5], {data: JSON.stringify(factory.GeoJSON.fromLayer(e.layer))})
                .then(response => {
                    const geojson = factory.geoJSON(geobuf.decode(protobuf(response)), config.pathOptions);
                    const stateData = store.getState().data.layers;

                    geojson.getLayers().forEach(layer => {
                        const id = layer.feature.id
            
                        // remove old app layers entries, will update with the new geojson set.
                        stateData[id] && stateData[id].removeFrom(Map);
            
                        // Flatten the geometry array, so utilities can read the thing. god knows why this happens.
                        layer.setLatLngs([ ...util.flattenDeep(layer.getLatLngs()) ])
                        layer.addTo(Map);
                        e.layer.removeFrom(Map);
                        _layerGroup.clearLayers().removeFrom(Map);
                        setState({
                            layer: layer, 
                            data: { 
                                ...layer.feature.properties, 
                                OBJECT_ID: layer.feature.id
                            },
                            isGuided: false
                        })
                    })
                })
                .catch(error => console.log(error))
        }

        Map.off('new_shape');
    }
    const _fillAP = () => {
        const currZoom = Map.getZoom();
        // This line ensures no racing codition on the current bounding box.
        // We set view manually before calling Map.getBBox in _fetchBlocks and bbox will NOT contain a whole country.
        Map.setView(Map.getCenter(), currZoom < MIN_DIGI_SCALE ? MIN_DIGI_SCALE: currZoom); // zoom is inverse to scale
        Map.on('new_shape', e => _fillParcel(e));
        _layerGroup.addTo(Map);
        polygon.enable(util.assign(config, fillConfig));
        _fetchBlocks(_id[6])
    }
    const _fillParcel = e => {
        if (e && e.layer) {
            http.call(_id, {data: JSON.stringify(factory.GeoJSON.fromLayer(e.layer))})
                .then(response => {
                    const geojson = factory.geoJSON(geobuf.decode(protobuf(response)), config.pathOptions);
                    const stateData = store.getState().data.layers;

                    geojson.getLayers().forEach(layer => {
                        const id = layer.feature.id
            
                        // remove old app layers entries, will update with the new geojson set.
                        stateData[id] && stateData[id].removeFrom(Map);
            
                        // Flatten the geometry array, so utilities can read the thing. god knows why this happens.
                        layer.setLatLngs([ ...util.flattenDeep(layer.getLatLngs()) ])
                        layer.addTo(Map);
                        e.layer.removeFrom(Map);
                        _layerGroup.clearLayers().removeFrom(Map);
                        setState({
                            layer: layer, 
                            data: { 
                                ...layer.feature.properties, 
                                OBJECT_ID: layer.feature.id
                            },
                            isGuided: false
                        })
                    })
                })
                .catch(error => console.log(error))
        }

        Map.off('new_shape');
    }
    const _stopPolyAP = () => {
        _layerGroup.clearLayers().removeFrom(Map);
        polygon.disable('force');
    }

    const _deleteAP = () => {
        const getLayer = e => setState({layer: e.target, isGuided: false});

        Map.eachLayer(function(layer) {
            if (layer.toGeoJSON) {
                layer.on('click', getLayer)
            }
        });
    }
    const _stopDeleteAP = () => {
        Map.eachLayer(function(layer) {
            if (layer.toGeoJSON) {
                layer.off('click')
            }
        });
    }

    return <ButtonGroup>
        <Button id={_id[0]} onClick={() => enable(_id[0], _createAP)} className={processID === _id[0] ? 'active' : ''} >
        <Icon name={_id[0]} size='32px' style={{marginTop: '2px'}} />
        <span style={{display: 'block', marginTop: '2px' }}>Додади парцела</span>
        {processID === _id[0] 
            && (isGuided
                ? <Guidance id={_id[0]} disable={disable} msg={createAPMsg} title='Додади земјоделска парцела' />
                : <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
                    <DrawActions cancel={disable} />
                </Form>)}
        </Button>
        <Button id={_id[1]} onClick={() => enable(_id[1], _drawAP)} className={processID === _id[1] ? 'active' : ''} >
            <Icon name={_id[1]} size='28px' style={{marginTop: '2px'}} />
            <span style={{display: 'block', marginTop: '5px' }}>Нацртај парцела</span>
            {processID === _id[1] 
                && (isGuided
                    ? <Guidance id={_id[1]}
                        finish={() => polygon._finishShape()} 
                        undo={() => polygon._removeLastVertex()} 
                        disable={() => disable(_stopDrawAP)} 
                        msg={drawAPMsg} 
                        title='Нацртај земјоделска парцела' />
                    : <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
                        <DrawActions 
                            cancel={() => disable(_stopDrawAP)} />
                    </Form>)}
        </Button>
        <Button 
            id={_id[2]} 
            className={processID === _id[2] ? 'active' : ''}
            onClick={() => {
                _editAP(); 
                enable(_id[2], _fetchBlocks.bind(_id[2]));
            }}>
            <Icon name='editAP' size='28px' style={{marginTop: '4px'}} />
            <span style={{display: 'block', marginTop: '3px' }}>Промени парцела</span>
            {processID === _id[2] 
                && (isGuided
                    ? <Guidance id={_id[2]} disable={() => disable(_stopEditAP)} msg={createAPMsg} title='Промени земјоделска парцела' />
                    : <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
                        <DrawActions cancel={() => disable(_stopEditAP)} />
                    </Form>)}
        </Button>
        <Divider />
        <Button id={_id[3]} onClick={() => enable(_id[3], _splitAP)} className={processID === _id[3] ? 'active' : ''} >
            <Icon name={_id[3]} size='28px' style={{marginTop: '2px'}} />
            <span style={{display: 'block', marginTop: '5px' }}>Подели парцела</span>
            {processID === _id[3] 
                && <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
                    <DrawActions 
                        finish={() => line._finishShape()} 
                        undo={() => line._removeLastVertex()} 
                        cancel={() => disable(_stopLineAP)} />
                </Form>}
        </Button>
        <Button id={_id[4]} onClick={() => enable(_id[4], _mergeAP)} className={processID === _id[4] ? 'active' : ''} >
            <Icon name={_id[4]} size='28px' style={{marginTop: '2px'}} />
            <span style={{display: 'block', marginTop: '5px' }}>Приспои парцели</span>
            {processID === _id[4] 
                && <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
                    <DrawActions 
                        finish={() => line._finishShape()} 
                        undo={() => line._removeLastVertex()} 
                        cancel={() => disable(_stopLineAP)} />
                </Form>}
        </Button>
        <Button id={_id[5]} onClick={() => { _cutAP(); enable(_id[5]); }} className={processID === _id[5] ? 'active' : ''} >
            <Icon name={_id[5]} size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Пресечи парцела</span>
            {processID === _id[5] 
                && (isGuided
                    ? <Guidance id={_id[5]}
                        finish={() => polygon._finishShape()} 
                        undo={() => polygon._removeLastVertex()} 
                        disable={() => disable(_stopPolyAP)} 
                        msg={cutAPMsg} 
                        title='Пресечи земјоделска парцела' />
                    : <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
                        <DrawActions 
                            cancel={() => disable(_stopPolyAP)} />
                    </Form>)} 
        </Button>
        <Button id={_id[6]} onClick={() => { _fillAP(); enable(_id[6]); }} className={processID === _id[6] ? 'active' : ''} >
            <Icon name={_id[6]} size='34px' />
            <span style={{display: 'block', marginTop: '2px' }}>Пополни парцела</span>
            {processID === _id[6] 
                && (isGuided
                    ? <Guidance id={_id[6]}
                        finish={() => polygon._finishShape()} 
                        undo={() => polygon._removeLastVertex()} 
                        disable={() => disable(_stopLineAP)} 
                        msg={cutAPMsg} 
                        title='Пресечи земјоделска парцела' />
                    : <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
                        <DrawActions 
                            cancel={() => disable(_stopLineAP)} />
                    </Form>)} 
        </Button>
        <Divider />
        <Button id={_id[7]} onClick={() => {}} className={processID === _id[7] ? 'active' : ''} >
            <Icon name={_id[7]} size='28px' style={{marginTop: '2px'}} />
            <span style={{display: 'block', marginTop: '5px' }}>Назначи стопанство</span>
            {processID === _id[7] && <Form />}
        </Button>
        <Divider />
        <Button id={_id[8]} onClick={() => enable(_id[8], _deleteAP)} className={processID === _id[8] ? 'active' : ''} >
            <Icon name={_id[8]} size='28px' style={{marginTop: '2px'}} />
            <span style={{display: 'block', marginTop: '5px' }}>Избриши парцела</span>
            {processID === _id[8] 
                && (isGuided
                    ? <Guidance id={_id[8]} disable={disable} msg={deleteAPMsg} title='Избриши земјоделска парцела' />
                    : <Modal id='measure-dialog'
                        show 
                        backdrop={false}
                        enforceFocus={false}
                        container={document.getElementsByClassName('control-map')[0]} >
                        <Modal.Title>
                            <Button disabled className='as-label ap-modal-title' >Избриши земјоделска парцела</Button>
                            <DrawActions cancel={() => disable(_stopDeleteAP)} />
                        </Modal.Title>
                        <Modal.Body className='ap-modal-body' >
                            <div id={_id[8]} >Дали сте сигурни дека сакате да ја избришете оваа земјоделска парцела?</div>
                            <Button 
                                onClick={() => { 
                                    layer.removeFrom(Map); disable(_stopDeleteAP); 
                                }} 
                                size='' 
                                className='cancel' > 
                                    Избриши 
                            </Button>
                        </Modal.Body>
                    </Modal>)}
        </Button>
    </ButtonGroup>;
}

_AgriParcel.propTypes = {
    processID: PropTypes.string,
    mapId: PropTypes.string,
    farmObjId: PropTypes.number,
}

export const AgriParcel = core.connect(state => 
    ({ processID: state.app.processID, mapId: state.map.id, farmObjId: state.farmRegistry?.farmObjId }))(_AgriParcel);

core.store.addState('http', restAP);