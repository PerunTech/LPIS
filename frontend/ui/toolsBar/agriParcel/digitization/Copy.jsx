import { React, Loading, elements } from 'perun-core';
import { core, ui, data } from '../../../../Spatial';
import { config, createAPMsg } from '../Config';
import { decodeResponse, getFarmMapAssets, strcmp } from '../../../Util';
import { saveAP } from '../SaveAP';
import { Guidance } from '../Guidance';
import { Form } from '../Form';
import { ProcessButton } from '../../ProcessButton';

const { Map, store, factory, http } = core;
const { geobuf, protobuf } = data;
const { Icon, DrawActions } = ui;
const { useReducer } = React;
const _id = 'copy-control';

/**
 * Create a crop parcel by selecting a single point.
 */
const _Copy = ({ processID, farmObjId }) => {
    const [{ layer, data, X, Y, loading, isGuided }, setState] = useReducer((currState, update) =>
        ({ ...currState, ...update }),
        { layer: {}, data: {}, X: 0, Y: 0, loading: false, isGuided: false });

    const enable = () => {
        store.dispatch({ processID: _id });
        setState({ isGuided: false })

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
                    const proto = protobuf(response);
                    const buff = geobuf.decode(proto);
                    const geojson = factory.geoJSON(buff, config.pathOptions);

                    geojson.getLayers().forEach(layer => {
                        // Flatten the geometry array, so utilities can read the thing. god knows why this happens.
                        //layer.setLatLngs([...util.flattenDeep(layer.getLatLngs())])

                        // assign metadata
                        layer.feature.id = 0
                        layer.feature.properties = { parent_id: farmerId }

                        layer.addTo(Map);
                        setState({ data: layer.feature.properties, layer: layer })
                    })
                })
                .catch(err => {
                    console.log(err)
                    disable()
                });

            Map.off('click');
        });
    };

    const disable = (responseType, response, isLoading) => {
        if (isLoading) {
            setState({ loading: true })
        } else {
            setState({ loading: false })
            if (strcmp(responseType, 'error')) {
                const errorMsg = decodeResponse(response)
                elements.alertUser(true, 'error', 'Грешка при зачувување', errorMsg);
            } else {
                Map.off('click');
                // Reset state, internal and application-wide.
                setState({ layer: {}, data: {}, X: 0, Y: 0, loading: false, enumIdx: [], enumNames: [], isGuided: false });
                store.dispatch({ processID: '' });
                // We remove the working geometry, save process will add the result.
                layer.removeFrom && layer.removeFrom(Map);
                getFarmMapAssets();
            }
        }
    }

    const onChange = ({ formData }) => {
        setState({ data: { ...data, ...formData } });
    }

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
    (isGuided
        ? <Guidance id={_id} disable={disable} msg={createAPMsg} title='Додади земјоделска парцела' />
        : <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
            <DrawActions cancel={disable} />
        </Form>);


    return <ProcessButton id={_id} onClick={enable} >
        <Icon name={_id} size='30px' />
        <span style={{ display: 'block', marginTop: '5px' }}>Копирај парцела</span>
        {processID === _id
            && renderForm()}
        {loading && <Loading />}
    </ProcessButton>;
};

export const Copy = core.connect(state => ({
    processID: state.app.processID, mapId: state.map.id, farmObjId: state.farmRegistry?.farmObjId
}))(_Copy)
