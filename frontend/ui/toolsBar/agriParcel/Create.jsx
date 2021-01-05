import { React, PropTypes } from 'perun-core';
import { core, data, ui, config as cfg } from '../../../Spatial';
import { config, createAPMsg } from './Config';
import { Form } from './Form';
import { Guidance } from './Guidance';
import { saveAP } from './Save';

const { MIN_DIGI_SCALE, MAP_CONFIG } = cfg;
const { Map, store, factory, http, util } = core;
const { geobuf, protobuf } = data;
const { Button, Icon, DrawActions } = ui;
const { useReducer } = React;
const _id = 'createAP';

/**
 * Create an agri parcel by selecting a single point.
 */
export const Create = ({ processID }) => {
    const [{layer, data, isGuided}, setState] = useReducer((currState, update) => 
        ({...currState, ...update}), 
        { layer: {}, data: {}, isGuided: false });

    const enable = () => {
        store.dispatch({ processID: _id, minZoom: MIN_DIGI_SCALE });
        setState({isGuided: true})

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
    };

    const disable = () => {
        // Reset state, internal and application-wide.
        setState({ layer: {}, data: {}, isGuided: false });
        store.dispatch({processID: '', minZoom: MAP_CONFIG.minZoom});
        // We remove the working geometry, save process will add the result.
        layer.removeFrom && layer.removeFrom(Map);
    }

    const onChange = ({ formData }) => 
        setState({data: { ...data, ...formData }});

    const onSubmit = ({ formData }) => 
        saveAP(JSON.stringify({ 
            ...data, 
            ...formData,
            OBJECT_ID: 0,
            GEOM: factory.GeoJSON.fromLayer(layer) }), disable);

    return <Button id={_id} onClick={enable} className={processID === _id ? 'active' : ''} >
        <Icon name={_id} size='32px' style={{marginTop: '2px'}} />
        <span style={{display: 'block', marginTop: '2px' }}>Додади парцела</span>
        {processID === _id 
            && (isGuided
                ? <Guidance id={_id} disable={disable} msg={createAPMsg} title='Додади земјоделска парцела' />
                : <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
                    <DrawActions cancel={disable} />
                </Form>)}
    </Button>;
};

Create.propTypes = {
    processID: PropTypes.string,
}