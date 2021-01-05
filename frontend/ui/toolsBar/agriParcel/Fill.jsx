import { React, PropTypes } from 'perun-core';
import { config as cfg, core, tools, ui, data } from '../../../Spatial';
import { fillConfig, config, cutAPMsg } from './Config';
import { Guidance } from './Guidance';
import { Form } from './Form';
import { saveAP } from './Save';

const { MIN_DIGI_SCALE, MAP_CONFIG } = cfg;
const { Map, store, factory, http, util } = core;
const { geobuf, protobuf } = data;
const { draw: { polygon } } = tools;
const { Button, Icon, DrawActions } = ui;

const _id = 'fillAP';
const _layerGroup = factory.layerGroup();
const _style = { color: '#eed000', fillColor: '#FFFFFF' };


export const Fill = ({processID}) => {
    const [{layer, data, isGuided}, setState] = React.useReducer((currState, update) => 
        ({...currState, ...update}), 
        { layer: {}, data: {}, isGuided: {} });

    const enable = () => {
        const currZoom = Map.getZoom();
        // This line ensures no racing codition on the current bounding box.
        // We set view manually before calling Map.getBBox in _fetchBlocks and bbox will NOT contain a whole country.
        Map.setView(Map.getCenter(), currZoom < MIN_DIGI_SCALE ? MIN_DIGI_SCALE: currZoom); // zoom is inverse to scale
        Map.on('new_shape', e => fillParcel(e));

        _layerGroup.addTo(Map);
        store.dispatch({minZoom: MIN_DIGI_SCALE, processID: _id})

        setState({isGuided: true})
        polygon.enable(fillConfig);
        _fetchBlocks()
    }

    const disable = () => {
        // Reset state, internal and application-wide.
        setState({layer: {}, data: {}, isGuided: false});
        store.dispatch({processID: '', minZoom: MAP_CONFIG.minZoom});

        // We remove the working geometry, save process will add the result, as well as additional vectors.
        _layerGroup.clearLayers().removeFrom(Map);
        layer.removeFrom && layer.removeFrom(Map);
        // Disable Split handler.
        polygon.disable('force');
    }

    const _fetchBlocks = () => {
        http.call('render_pb', {
            url: '/spatial/geometry/get/bbox/{init.token}/AGRI_PARCEL/' + Map.getBBox(),
        })
        .then(response => _renderBlocks(geobuf.decode(protobuf(response))))
        .catch(err => console.log(err));
    }

    const _renderBlocks = jsonArr => {
        // filter layers, remove old app layers entries, will update with the new geojson set.
        const mapLayers = store.getState().data.layers;

        jsonArr.features.map(feature => {
            mapLayers[feature.id] && mapLayers[feature.id].removeFrom(Map);

            factory.geoJSON(feature, {
                onEachFeature: function (feature, layer) {
                    _layerGroup.addLayer(layer);
                },
                style: _style
            });
        })
    }

    const fillParcel = e => {
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

    const onSubmit = ({ formData }) => {
        saveAP(JSON.stringify({ 
            ...data, 
            ...formData, 
            OBJECT_ID: Number(layer.feature.id),
            GEOM: factory.GeoJSON.fromLayer(layer) }), disable);
    }

    const onChange = ({ formData }) => 
        setState({data: { ...data, ...formData }});

    const renderForm = () =>
        isGuided
            ? <Guidance id={_id}
                finish={() => polygon._finishShape()} 
                undo={() => polygon._removeLastVertex()} 
                disable={disable} 
                msg={cutAPMsg} 
                title='Пресечи земјоделска парцела' />
            : <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
                <DrawActions 
                    cancel={disable} />
            </Form>;


    return <Button id={_id} onClick={enable} className={processID === _id ? 'active' : ''} >
        <Icon name={_id} size='34px' />
        <span style={{display: 'block', marginTop: '2px' }}>Пополни парцела</span>
        {processID === _id && renderForm()} 
    </Button>
}

Fill.propTypes = {
    processID: PropTypes.string,
}