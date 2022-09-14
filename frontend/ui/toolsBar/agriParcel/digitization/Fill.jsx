import { React, Loading, elements } from 'perun-core';
import { core, ui, data, tools } from '../../../../Spatial';
import { config, fillAPMsg } from '../Config';
import { saveAP } from '../SaveAP';
import { Guidance } from '../Guidance';
import { Form } from '../Form';
import { ProcessButton } from '../../ProcessButton';
import { getFarmMapAssets } from '../../../Util'

const { Map, store, factory, http } = core;
const { geobuf, protobuf } = data;
const { draw: { polygon } } = tools
const { Icon, DrawActions } = ui;
const { useReducer, useEffect } = React;
const _id = 'fillAP';

const _Fill = ({ processID, farmObjId, saveIsPending }) => {
    const [{ layer, data, isGuided, showForm }, setState] = useReducer((currState, update) =>
        ({ ...currState, ...update }),
        { layer: {}, data: {}, isGuided: false, showForm: false });

    useEffect(() => {
        return () => {
            polygon.disable('force');
            Map.off('new_shape');
        }
    }, [])

    const enable = () => {
        Map.on('new_shape', e => fillParcel(e));
        // state setters
        store.dispatch({ processID: _id });
        setState({ isGuided: true, showForm: false })
        // init draw handler
        polygon.enable(config);
    }

    const disable = () => {
        // Reset state, internal and application-wide.
        Map.off('new_shape');
        setState({ layer: {}, data: {}, isGuided: false, showForm: false });
        store.dispatch({ processID: '' });
        // We remove the working geometry, save process will add the result, as well as additional vectors.
        layer.removeFrom && layer.removeFrom(Map);
        polygon.disable('force');
        // refresh work layer
        getFarmMapAssets()
    }

    const fillParcel = e => {
        if (e && e.layer) {
            http.call(_id, {
                url: '/spatial/geometry/fill/{init.token}/AGRI_PARCEL/' + farmObjId,
                method: 'post',
                responseType: 'arraybuffer',
                data: JSON.stringify(factory.GeoJSON.fromLayer(e.layer))
            }).then(response => {
                const buff = geobuf.decode(protobuf(response));
                const geojson = factory.geoJSON(buff, config.pathOptions);
                geojson.getLayers().forEach(layer => {
                    layer.addTo(Map);
                    e.layer.removeFrom(Map);
                    setState({
                        layer: layer,
                        data: {
                            ...layer.feature.properties,
                            OBJECT_ID: Number(layer.feature.id)
                        },
                        isGuided: false,
                        showForm: true
                    })
                })
            }).catch(error => {
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
        saveAP(JSON.stringify({
            ...data,
            ...formData,
            GEOM: factory.GeoJSON.fromLayer(layer)
        }), disable);
    }

    const onChange = ({ formData }) => {
        setState({ data: { ...data, ...formData } });
    }

    const renderGuideForm = () => {
        return <Guidance id={_id}
            finish={() => polygon._finishShape()}
            undo={() => polygon._removeLastVertex()}
            disable={() => disable()}
            msg={fillAPMsg}
            title='Пополни земјоделска парцела'
        />
    }

    const renderForm = () => {
        return <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
            <DrawActions cancel={() => disable()} />
        </Form>
    }

    const renderComponent = () => {
        let componentToRender = null

        if (isGuided && !showForm) {
            componentToRender = renderGuideForm()
        } else if (showForm && !isGuided) {
            componentToRender = renderForm()
        }

        return componentToRender
    }

    return <ProcessButton id={_id} onClick={enable} title='Пополни парцела' >
        <Icon name={_id} size='30px' />
        <span style={{ display: 'block', marginTop: '5px' }}>Пополни</span>
        {processID === _id && renderComponent()}
        {saveIsPending && <Loading />}
    </ProcessButton>
}

export const Fill = core.connect(state => ({
    processID: state.app.processID, saveIsPending: state.farmRegistry?.saveIsPending, farmObjId: state.farmRegistry?.farmObjId
}))(_Fill)
