import { React, elements } from 'perun-core';
import { core, ui, data, tools } from '../../../../Spatial';
import { config } from '../Config';
import { saveAP } from '../Save';
import { Guidance } from '../Guidance';
import { Form } from '../Form';
import { ProcessButton } from '../../ProcessButton';

const { Map, store, factory, http } = core;
const { geobuf, protobuf } = data;
const { draw: { polygon } } = tools
const { Icon, DrawActions } = ui;
const { useReducer } = React;
const _id = 'fillAP';

const _Fill = ({ processID, farmObjId }) => {
    const [{ layer, data, isGuided }, setState] = useReducer((currState, update) =>
        ({ ...currState, ...update }),
        { layer: {}, data: {}, isLoadingCrops: false, isGuided: {}, enumIdx: [], enumNames: [] });

    const enable = () => {
        Map.on('new_shape', e => fillParcel(e));

        // state setters
        store.dispatch({ processID: _id });
        setState({ isGuided: true })

        // init draw handler
        polygon.enable(config);
    }

    const disable = () => {
        // Reset state, internal and application-wide.
        Map.off('new_shape');
        setState({ layer: {}, data: {}, isGuided: false });
        store.dispatch({ processID: '' });

        // We remove the working geometry, save process will add the result, as well as additional vectors.
        layer.removeFrom && layer.removeFrom(Map);

        polygon.disable('force');

        // refresh work layer
        getSpatialResults();
    }

    const fillParcel = e => {
        if (e && e.layer) {
            http.call(_id, {
                url: '/spatial/geometry/fill/{init.token}/AGRI_PARCEL/' + farmObjId,
                method: 'post',
                responseType: 'arraybuffer',
                data: JSON.stringify(factory.GeoJSON.fromLayer(e.layer))
            })
                .then(response => {
                    const buff = geobuf.decode(protobuf(response));
                    const geojson = factory.geoJSON(buff, config.pathOptions);
                    const stateData = store.getState().data.layers;

                    geojson.getLayers().forEach(layer => {
                        const id = layer.feature.id

                        // remove old app layers entries, will update with the new geojson set.
                        stateData[id] && stateData[id].removeFrom(Map);

                        layer.addTo(Map);
                        e.layer.removeFrom(Map);

                        setState({
                            layer: layer,
                            data: {
                                ...layer.feature.properties,
                                OBJECT_ID: Number(layer.feature.id)
                            },
                            isGuided: false
                        })
                    })
                })
                .catch(error => {
                    e.layer.removeFrom(Map);
                    let enc = new TextDecoder("utf-8");
                    let errmsg = enc.decode(error.response.data);
                    elements.alertUser(true,
                        'error',
                        'Грешка при пополнување парцела',
                        errmsg
                    );
                })
        }

        Map.off('new_shape');
    }

    const onSubmit = ({ formData }) => {
        saveAP({
            ...data,
            ...formData,
            GEOM: factory.GeoJSON.fromLayer(layer)
        }, disable);
    }

    const onChange = ({ formData }) => {
        setState({ data: { ...data, ...formData } });
    }

    const renderForm = () =>
    (isGuided
        ? <Guidance id={_id}
            finish={() => polygon._finishShape()}
            undo={() => polygon._removeLastVertex()}
            disable={() => disable()}
            msg={['', '']}
            title='Пополни земјоделска парцела' />
        : <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
            <DrawActions
                cancel={() => disable()} />
        </Form>);


    return <ProcessButton id={_id} onClick={enable} className={processID === _id ? 'active' : ''} >
        <Icon name={_id} size='30px' />
        <span style={{ display: 'block', marginTop: '5px' }}>Пополни парцела</span>
        {processID === _id && renderForm()}
    </ProcessButton>
}

export const Fill = core.connect(state => ({
    processID: state.app.processID, mapId: state.map.id, farmObjId: state.farmRegistry?.farmObjId
}))(_Fill)
