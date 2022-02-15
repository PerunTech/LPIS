import { React, Loading, redux } from 'perun-core';
import { core, ui, data } from '../../../../Spatial';
import { getFarmMapAssets } from '../../../Util';
import { ProcessButton } from '../../ProcessButton';
import { Guidance } from './Guidance';
import { Form } from '../Form';
import { createAPMsg } from '../Config';
import { saveAP } from '../Save';

const { Map, store, factory, http } = core;
const { geobuf, protobuf } = data;
const { Icon, DrawActions } = ui;
const { useReducer } = React;
const _id = 'createAP';

const _Create = ({ processID, mapId, farmObjId }) => {
    const [{ layer, data, X, Y, loading, isGuided }, setState] = useReducer((currState, update) =>
        ({ ...currState, ...update }),
        { layer: {}, data: {}, X: 0, Y: 0, loading: false, isGuided: false });

    const enable = () => {
        store.dispatch({ processID: _id });
        setState({ isGuided: false, schema: getFormSchema().schema })

        // Click handler for selection of location and creation of crop parcel geometry.
        Map.on('click', e => {
            const p = Map.transform(e.latlng);
            setState({ X: p.x, Y: p.y, loading: true });

            http.call('copy-agri', {
                url: '/spatial/geometry/layer/cutoff/{init.token}/PHYSICAL_BLOCK/AGRI_PARCEL/' + p.x + '/' + p.y,
                method: 'get',
                responseType: 'arraybuffer',
            })
                .then(response => {
                    setState({ loading: false })
                    const data = geobuf.decode(protobuf(response));
                    const geojson = factory.geoJSON(data, config.pathOptions);
                    const stateData = store.getState().data.layers;

                    geojson.getLayers().forEach(layer => {
                        const id = layer.feature.id

                        // remove old app layers entries, will update with the new geojson set.
                        stateData[id] && stateData[id].removeFrom(Map);

                        // Flatten the geometry array, so utilities can read the thing. god knows why this happens.
                        layer.setLatLngs([...util.flattenDeep(layer.getLatLngs())])

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
                        setState({ data: layer.feature.properties, layer: layer, isGuided: false })
                    })
                })
                .catch(err => {
                    console.log(err)
                    disable()
                });

            Map.off('click');
        });
    };

    const disable = (fn) => {
        // Reset state, internal and application-wide.
        setState({ layer: {}, data: {}, isGuided: false });
        store.dispatch({ processID: '', minZoom: MAP_CONFIG.minZoom });
        // We remove the working geometry, save process will add the result.
        layer.removeFrom && layer.removeFrom(Map);
        if (mapId === 'farm-registry-map') {
            const session = redux.store.getState().security.svSession
            getFarmMapAssets(session)
        }
        fn && fn();
    }

    const onChange = ({ formData }) =>
        setState({ data: { ...data, ...formData } });

    const onSubmit = ({ formData }) =>
        saveAP({
            ...data,
            ...formData,
            GEOM: factory.GeoJSON.fromLayer(layer),
            X: X,
            Y: Y,
            parent_id: farmObjId,
            OBJECT_ID: 0
        }, disable);

    const renderForm = () =>
    (isGuided ? <Guidance id={_id[0]} disable={disable} msg={createAPMsg} title='Додади земјоделска парцела' />
        : <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
            <DrawActions cancel={disable} />
        </Form>
    )


    return <ProcessButton id={_id} onClick={enable} >
        <Icon name={_id} size='30px' />
        <span style={{ display: 'block', marginTop: '5px' }}>Додади парцела</span>
        {processID === _id
            && renderForm()}
        {loading && <Loading />}
    </ProcessButton>;
};

export const Create = core.connect(state => ({
    processID: state.app.processID, mapId: state.map.id, farmObjId: state.farmRegistry?.farmObjId
}))(_Create)
