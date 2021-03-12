import { React, PropTypes } from 'perun-core';
import { config as cfg, core, data, tools, ui } from '../../../Spatial';
import { config } from './Config';
import { Form } from './Form';
import { saveCP } from './Save';

const { MIN_DIGI_SCALE, MAP_CONFIG } = cfg;
const { Map, store, factory, http } = core;
const { protobuf, geobuf } = data;
const { edit } = tools;
const { Button, Icon, DrawActions } = ui;
const { useReducer } = React;

const _id = 'editCP';
const _layerGroup = factory.layerGroup();
const _style = { color: '#eed000', fillColor: '#FFFFFF' };

/**
 * Create an agri parcel by selecting a single point.
 */
export const Edit = ({ processID }) => {
    const [{layer, data, isGuided}, setState] = useReducer((currState, update) => 
        ({...currState, ...update}), 
        { layer: {}, data: {}, isGuided: false });

    const enable = () => {
        const currZoom = Map.getZoom();
        // This line ensures no racing codition on the current bounding box.
        // We set view manually before calling Map.getBBox in _fetchBlocks and bbox will NOT contain a whole country.
        Map.setView(Map.getCenter(), currZoom < MIN_DIGI_SCALE ? MIN_DIGI_SCALE: currZoom); // zoom is inverse to scale

        _layerGroup.addTo(Map);
        store.dispatch({minZoom: MIN_DIGI_SCALE, processID: _id})
        setState({isGuided: true})
        
        // Parcels are already loaded, activate handlers on each. Do not call REST.
        // _fetchBlocks(); 
        const layers = store.getState().data.layers;
        console.log(layers)
    };

    const disable = () => {
        setState({layer: {}, data: {}, isGuided: false})
        _layerGroup.clearLayers().removeFrom(Map);
        store.dispatch({processID: '', minZoom: MAP_CONFIG.minZoom});
        edit.polygon.disable();
    }

    /*
    const _fetchBlocks = () => {
        http.call('render_pb', {
            url: '/spatial/geometry/get/bbox/{init.token}/LAND_USE_PLAN/' + Map.getBBox(),
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
                    _setBlockEvents(layer);
                    _layerGroup.addLayer(layer);
                },
                style: _style
            });
        })
    }
    */
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

    const onSubmit = ({ formData }) => 
        saveCP(JSON.stringify({ 
            ...data, 
            ...formData,
            OBJECT_ID: Number(layer.feature.id),
            GEOM: factory.GeoJSON.fromLayer(layer) }), disable);

    const onChange = ({ formData }) => 
        setState({data: { ...data, ...formData }});

    return <Button 
        id={_id} 
        className={processID === _id ? 'active' : ''}
        onClick={enable}>
        <Icon name={_id} size='32px' />
        <span style={{display: 'block', marginTop: '2px' }}>Промени производна парцела</span>
        {processID === _id 
            && (isGuided && <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
                    <DrawActions cancel={disable} />
                </Form>)}
    </Button>;
};

Edit.propTypes = {
    processID: PropTypes.string,
}
