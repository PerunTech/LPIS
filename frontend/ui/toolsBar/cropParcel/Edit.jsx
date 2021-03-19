import { React, PropTypes, elements } from 'perun-core';
import { core, tools, ui } from '../../../Spatial';
import { config, editCPMsg } from './Config';
import { Form } from './Form';
import { Guidance } from './Guidance';
import { saveCP } from './Save';
import { loadFarmerAssets } from '../..';

const { Map, store, factory } = core;
const { edit } = tools;
const { Button, Icon, DrawActions } = ui;
const { useReducer } = React;

const _id = 'editCP';

/**
 * Create an agri parcel by selecting a single point.
 */
export const Edit = ({ processID, farmerId }) => {
    const [{layer, data, isGuided}, setState] = useReducer((currState, update) => 
        ({...currState, ...update}), 
        { layer: {}, data: {}, isGuided: false });

    const enable = () => {
        //const currZoom = Map.getZoom();
        // This line ensures no racing codition on the current bounding box.
        // We set view manually before calling Map.getBBox in _fetchBlocks and bbox will NOT contain a whole country.
        //Map.setView(Map.getCenter(), currZoom < MIN_DIGI_SCALE ? MIN_DIGI_SCALE: currZoom); // zoom is inverse to scale

        // _layerGroup.addTo(Map);
        // store.dispatch({minZoom: MIN_DIGI_SCALE, processID: _id})

        
        // Parcels are already loaded, activate handlers on each. Do not call REST.
        const layers = store.getState().data.layers;
        const cropParcels = Object.values(layers).filter(layer => layer.getMetadata().type === 'land_use_plan');
        

        if (cropParcels.length > 0) {
            cropParcels.forEach(cp => _setBlockEvents(cp, cropParcels))// _layerGroup.addLayer(cp),
            store.dispatch({processID: _id})
            setState({isGuided: true})
            // Map.fitBounds(cropParcels[0].getBounds());
        } else {
            disable();
            elements.alertUser(true, 
                'warning', 
                'Не се пронајдени производни парцели.', 
                'Додадете производни парцели со просторна определба пред да ја користите алатката за менување.');
        }
    };

    const disable = () => {
        setState({layer: {}, data: {}, isGuided: false})
        // _layerGroup.clearLayers().removeFrom(Map);
        // store.dispatch({processID: '', minZoom: MAP_CONFIG.minZoom});
        loadFarmerAssets(store.getState().gsaa.token, farmerId);
        store.dispatch({processID: ''});
        edit.polygon.disable();
    }

    const _setBlockEvents = (cp, cropParcels) => {
        cp.on('mouseover', function () { this.setStyle({ color: '#00E334',  fillColor: '#000000' })})
            .on('mouseout', function () { this.setStyle( config.pathOptions )})
            .on('click', function () {
                initEdit(this);
                cropParcels.forEach(cp => cp.off('mouseover mouseout click'))
            }).bringToFront();
    }

    const initEdit = layer => {
        // layer.setStyle(_style)
        // disable all selection events on group. Remove edited layer from group.
        // _layerGroup.eachLayer(el => el.off('mouseover mouseout click'));
        // _layerGroup.removeLayer(layer);

        // re-add layer as standalone.
        // layer.options.metadata = config.pathOptions.metadata;
        //layer.addTo(Map);

        // Move map view on top of selected polygon.
        Map.fitBounds(layer.getBounds());

        // Activate edit handler on selected polygon
        edit.polygon.enable(layer, config);
        setState({layer: layer, data: layer.feature.properties, isGuided: false});

        // Activate edit event listeners on layer.
        layer.on('pm:edit', e => setState({ layer: e.target }));
    }

    /*
    const _simplifyMultipolygon = layer => {
        console.log(layer)
        let latlngArr = layer._latlngs
        let simpleLatlngArr = latlngArr[0];
        latlngArr.length = 0

        Object.keys(simpleLatlngArr).forEach(key => 
            latlngArr.push(simpleLatlngArr[key]));

        return layer;
    }*/

    const onSubmit = ({ formData }) => {
        saveCP(JSON.stringify({ 
            ...data, 
            ...formData,
            OBJECT_ID: Number(layer.feature.id),
            object_id: Number(layer.feature.id),
            GEOM: factory.GeoJSON.fromLayer(layer) }), disable);
    }

    const onChange = ({ formData }) => 
        setState({data: { ...data, ...formData }});

    return <Button 
        id={_id} 
        className={processID === _id ? 'active' : ''}
        onClick={enable}>
        <Icon name={_id} size='32px' />
        <span style={{display: 'block', marginTop: '2px' }}>Промени производна парцела</span>
        {processID === _id
            && (isGuided
                ? <Guidance id={_id} disable={disable} msg={editCPMsg} title='Промени производна парцела' />
                : <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
                    <DrawActions cancel={disable} />
                </Form>)}
    </Button>;
};

Edit.propTypes = {
    processID: PropTypes.string,
    farmerId: PropTypes.number
}
