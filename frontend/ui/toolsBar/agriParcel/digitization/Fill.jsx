import { React, PropTypes, redux, elements } from 'perun-core';
import {
    core, tools, ui, data, cntAdvConfig, getCropCodesByLandUseCode, getFormSchema, ProcessButton, GuideForm, Form,
    saveControl, getSpatialResults, selectParcel
} from '../../..';

const { Map, store, factory, http } = core;
const { geobuf, protobuf } = data;
const { draw: { polygon } } = tools;
const { Icon, DrawActions } = ui;

const _id = 'fill-control';

export const Fill = ({ processID }) => {
    const [{ layer, data, isLoadingCrops, isGuided, enumIdx, enumNames }, setState] = React.useReducer((currState, update) =>
        ({ ...currState, ...update }),
        { layer: {}, data: {}, isLoadingCrops: false, isGuided: {}, enumIdx: [], enumNames: [] });

    selectParcel()

    const enable = () => {
        Map.on('new_shape', e => fillParcel(e));

        // state setters
        store.dispatch({ processID: _id });
        setState({ isGuided: true })

        // init draw handler
        polygon.enable(cntAdvConfig);
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
                url: '/spatial/geometry/fill/{init.token}/SPATIAL_CONTROL/' + redux.store.getState().mapData.cid,
                method: 'post',
                responseType: 'arraybuffer',
                data: JSON.stringify(factory.GeoJSON.fromLayer(e.layer))
            })
                .then(response => {
                    const buff = geobuf.decode(protobuf(response));
                    const geojson = factory.geoJSON(buff, cntAdvConfig.pathOptions);
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
                                OBJECT_ID: Number(layer.feature.id),
                                FORCE_CROP_REFRESH: true
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
                        'Грешка при пополнување просторна контрола',
                        errmsg
                    );
                })
        }

        Map.off('new_shape');
    }

    const onSubmit = ({ formData }) => {
        saveControl({
            ...data,
            ...formData,
            GEOM: factory.GeoJSON.fromLayer(layer)
        }, disable);
    }

    const refreshCropCodes = (formData, cropData) => {
        setState({ data: { ...data, ...formData, FORCE_CROP_REFRESH: false }, enumIdx: cropData.enum, enumNames: cropData.enumNames, isLoadingCrops: false });
    }

    const onChange = ({ formData }) => {
        if (formData.CONTROLLED_LAND_USE !== data.CONTROLLED_LAND_USE || formData.FORCE_CROP_REFRESH) {
            getCropCodesByLandUseCode(formData, refreshCropCodes);
            setState({ isLoadingCrops: true })
        } else setState({ data: { ...data, ...formData } });
    }

    const renderForm = () =>
        isGuided
            ? <GuideForm id={_id}
                finish={() => polygon._finishShape()}
                undo={() => polygon._removeLastVertex()}
                disable={disable}
                msg={['', '']}
                title='Пополни парцела' />
            : <Form
                schema={getFormSchema(data, enumIdx, enumNames).schema}
                uiSchema={getFormSchema(data, enumIdx, enumNames, isLoadingCrops).uiSchema}
                onSubmit={onSubmit}
                onChange={onChange}
                formData={data} >
                <DrawActions
                    cancel={disable} />
            </Form>;


    return <ProcessButton id={_id} onClick={enable} className={processID === _id ? 'active' : ''} >
        <Icon name={_id} size='30px' />
        <span style={{ display: 'block', marginTop: '5px' }}>Пополни парцела</span>
        {processID === _id && renderForm()}
    </ProcessButton>
}

Fill.propTypes = {
    processID: PropTypes.string,
}