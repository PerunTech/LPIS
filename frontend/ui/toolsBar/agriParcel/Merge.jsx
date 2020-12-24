import { React, PropTypes, elements } from 'perun-core';
import { core, tools, ui, data } from '../../../Spatial';
import { config } from './Config';
import { Form } from './Form';
import { saveAP } from './Save';

const { Map, store, factory, http, util } = core;
const { geobuf, protobuf } = data;
const { draw: { line } } = tools;
const { Button, Icon, DrawActions } = ui;
const { useReducer } = React;
const _id = 'mergeAP';

/**
 * Merge an agri parcel.
 */
export const Merge = ({ processID }) => {
    const [{layer, data}, setState] = useReducer((currState, update) => 
        ({...currState, ...update}), { layer: {}, data: {} });

    const enable = () => {
        Map.on('new_shape', e => {
            if (e && e.layer) {
                http.call(_id, {data: JSON.stringify(factory.GeoJSON.fromLayer(e.layer))})
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
        store.dispatch({ processID: _id });
        line.enable(config);
    };

    const disable = () => {
        // Reset state, internal and application-wide.
        setState({ layer: {}, data: {} });
        store.dispatch({processID: ''});

        // We remove the working geometry, save process will add the result.
        layer.removeFrom && layer.removeFrom(Map);
        // Disable Merge handler.
        line.disable('force');
    }

    const onChange = ({ formData }) => 
        setState({data: { ...data, ...formData }});

    const onSubmit = ({ formData }) => 
        saveAP(JSON.stringify({ ...data, ...formData, GEOM: factory.GeoJSON.fromLayer(layer) }), disable);

    return <Button id={_id} onClick={enable} className={processID === _id ? 'active' : ''} >
        <Icon name={_id} size='28px' style={{marginTop: '2px'}} />
        <span style={{display: 'block', marginTop: '5px' }}>Приспои парцела</span>
        {processID === _id 
            && <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
                <DrawActions 
                    finish={() => line._finishShape()} 
                    undo={() => line._removeLastVertex()} 
                    cancel={disable} />
            </Form>}
    </Button>;
};

Merge.propTypes = {
    processID: PropTypes.string,
}