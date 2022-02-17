import { React, PropTypes } from 'perun-core';
import { core, data, ui, config as cfg } from '../../../Spatial';
import { config, createCPMsg } from './Config';
import { Form } from './Form';
import { Guidance } from './Guidance';
import { saveCP } from './Save';
import { ProcessButton, loadFarmerAssets } from '../..';
import { getFarmMapAssets } from '../../Util';

const { MIN_DIGI_SCALE, MAP_CONFIG } = cfg;
const { Map, store, factory, http, util } = core;
const { geobuf, protobuf } = data;
const { Icon, DrawActions } = ui;
const { useReducer } = React;
const _id = 'createCP';

/**
 * Create a crop parcel by selecting a single point.
 */
const _Create = ({ processID, mapId, farmerId, farmObjId }) => {
    const [{ layer, data, X, Y, enumIdx, enumNames, isGuided }, setState] = useReducer((currState, update) =>
        ({ ...currState, ...update }),
        { layer: {}, data: {}, X: 0, Y: 0, enumIdx: [], enumNames: [], isGuided: false });

    const enable = () => {
        store.dispatch({ processID: _id, minZoom: MIN_DIGI_SCALE });
        setState({ isGuided: true })

        // Click handler for selection of location and creation of crop parcel geometry.
        Map.on('click', e => {
            const p = Map.transform(e.latlng);
            setState({ X: p.x, Y: p.y });

            http.call('create_ap', {
                url: '/spatial/geometry/layer/cutoff/{init.token}/AGRI_PARCEL/LAND_USE_PLAN/' + p.x + '/' + p.y
            })
                .then(response => {
                    const data = geobuf.decode(protobuf(response));
                    const geojson = factory.geoJSON(data, config.pathOptions);

                    geojson.getLayers().forEach(layer => {
                        // Flatten the geometry array, so utilities can read the thing. god knows why this happens.
                        layer.setLatLngs([...util.flattenDeep(layer.getLatLngs())])

                        // assign metadata
                        layer.feature.id = 0
                        layer.feature.properties = { parent_id: farmerId }

                        layer.addTo(Map);
                        setState({ data: layer.feature.properties, layer: layer })
                        let url = '/lpis/get/cropList/{gsaa.token}/{gsaa.farmerId}'
                        if (mapId === 'farm-registry-map') {
                            url = `/lpis/get/cropList/{init.token}/${farmObjId}`
                        }
                        http.call('get_code_list', {
                            method: 'post', url,
                            data: JSON.stringify({
                                ...data,
                                GEOM: factory.GeoJSON.fromLayer(layer)
                            }),
                        })
                            .then(response => {
                                setState({ enumIdx: response.data.enum, enumNames: response.data.enumNames })
                                setState({ isGuided: false })
                            })
                            .catch(err => {
                                console.log(err);
                                disable();
                            })
                    })
                })
                .catch(err => {
                    console.log(err)
                    disable()
                });

            Map.off('click');
        });
    };

    const disable = () => {
        Map.off('click');
        // Reset state, internal and application-wide.
        setState({ layer: {}, data: {}, X: 0, Y: 0, enumIdx: [], enumNames: [], isGuided: false });
        store.dispatch({ processID: '', minZoom: MAP_CONFIG.minZoom });
        // We remove the working geometry, save process will add the result.
        layer.removeFrom && layer.removeFrom(Map);
        // add refresh assets
        if (mapId === 'farm-registry-map') {
            getFarmMapAssets();
        } else {
            loadFarmerAssets();
        }
    }

    const onChange = ({ formData }) =>
        setState({ data: { ...data, ...formData } });

    const onSubmit = ({ formData }) =>
        saveCP(JSON.stringify({
            ...data,
            ...formData,
            GEOM: factory.GeoJSON.fromLayer(layer),
            X: X,
            Y: Y
        }), disable);

    return <ProcessButton id={_id} onClick={enable} >
        <Icon name={_id} size='30px' />
        <span style={{ display: 'block', marginTop: '2px' }}>Додади производна парцела</span>
        {processID === _id
            && (isGuided
                ? <Guidance id={_id} disable={disable} msg={createCPMsg} title='Додади производна парцела' />
                : <Form onSubmit={onSubmit} onChange={onChange} formData={data} enumIdx={enumIdx} enumNames={enumNames} >
                    <DrawActions cancel={disable} />
                </Form>)}
    </ProcessButton>;
};

_Create.propTypes = {
    processID: PropTypes.string,
    mapId: PropTypes.string,
    farmerId: PropTypes.number,
    farmObjId: PropTypes.number
}

export const Create = core.connect(state => ({
    mapId: state.map.id, farmObjId: state.farmRegistry?.farmObjId
}))(_Create)
