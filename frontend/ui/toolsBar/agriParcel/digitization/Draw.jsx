import { React, Loading, elements } from 'perun-core';
import { core, ui, tools, config as cfg } from '../../../../Spatial';
import { config, permanentCropSchema } from '../Config';
import { bufferToString, getFarmMapAssets, isJSON } from '../../../Util';
import { saveAP } from '../SaveAP';
import { GuideForm } from '../GuideForm';
import { Form } from '../Form';
import { ProcessButton } from '../../ProcessButton';

const { Map, store, factory, http } = core;
const { draw: { polygon } } = tools;
const { Icon, DrawActions } = ui;
const { MAP_CONFIG } = cfg;
const { alertUser } = elements;
const { useReducer } = React;
const _id = 'drawAP';

const _Draw = ({ processID, farmObjId, saveIsPending }) => {
    const [{ layer, data, geojson, isGuided, showForm, showPermanentCropForm, permanentCropData }, setState] = useReducer((currState, update) =>
        ({ ...currState, ...update }),
        { layer: {}, data: {}, geojson: {}, isGuided: false, showForm: false, showPermanentCropForm: false, permanentCropData: {} });

    const enable = () => {
        Map.on('new_shape', e => {
            if (e && e.layer) {
                setState({ layer: e.layer, isGuided: false, showForm: true, showPermanentCropForm: false })
                e.layer.addTo(Map)
            }
            Map.off('new_shape');
        });

        setState({ isGuided: true, showForm: false, data: {}, layer: {} });
        store.dispatch({ processID: _id });
        polygon.enable(config.pathOptions, 12, 15, false);
    };

    const reset = () => {
        // Reset state, internal and application-wide.
        setState({ layer: {}, data: {}, geojson: {}, isGuided: false, showForm: false, showPermanentCropForm: false, permanentCropData: {} });
        store.dispatch({ processID: '', maxZoom: MAP_CONFIG.maxZoom });
        // We remove the working geometry, save process will add the result.
        layer.removeFrom && layer.removeFrom(Map);
        // Disable draw handler.
        polygon.disable('force');
        // Refresh the data
        getFarmMapAssets();
    }

    const disable = (data, geojson) => {
        if (data && data.LAND_COVER_CODE) {
            if (Number(data.LAND_COVER_CODE) >= 400 && Number(data.LAND_COVER_CODE) < 500) {
                store.dispatch({ processID: _id });
                setState({ data: {}, geojson, showPermanentCropForm: true, isGuided: false, showForm: false })
            } else {
                reset()
            }
        } else {
            reset()
        }
    };

    const onChange = ({ formData }) => {
        setState({ data: { ...data, ...formData } });
    }

    const onPermanentCropChange = ({ formData }) => {
        setState({ permanentCropData: { ...permanentCropData, ...formData } });
    }

    const onSubmit = ({ formData }) => {
        saveAP(JSON.stringify({
            ...data,
            ...formData,
            OBJECT_ID: 0,
            parent_id: farmObjId,
            GEOM: factory.GeoJSON.fromLayer(layer)
        }), disable);
    }

    const submitPermanentCrop = data => {
        const url = `/lpis/save/permanentCrop/{init.token}/0/${farmObjId}`
        http.call(_id, { url, method: 'post', data, responseType: 'arraybuffer' }).then(res => {
            const parsedResponse = bufferToString(res.data)
            let title = 'Успешно додадени информации за повеќегодишна култура'
            if (isJSON(parsedResponse)) {
                const jsonResponse = JSON.parse(parsedResponse)
                title = jsonResponse.label_code || title
                alertUser(true, jsonResponse.type?.toLowerCase() || 'success', title)
                disable()
            } else {
                alertUser(true, 'success', title)
                disable()
            }
        }).catch(err => {
            const { response } = err
            const parsedResponse = bufferToString(response)
            console.error(parsedResponse)
            alertUser(true, 'error', 'Настана грешка')
            disable()
        })
    }

    const onPermanentCropSubmit = ({ formData }) => {
        // Clone the object first, don't use it directly as a function argument
        const data = formData
        const parcelId = geojson[0].feature.id
        const oldId = geojson[0].feature.properties.OLD_ID || 0
        const isEmpty = Object.values(data).every(v => v === null || v === undefined || v === '')
        // If the object is empty, alert the user
        if (isEmpty) {
            alertUser(true, 'info', 'Внесете вредности и обидете се повторно')
        } else {
            // Parse every value as an integer and remove the empty ones
            Object.keys(data).forEach(k => {
                if (data[k]) {
                    data[k] = parseInt(data[k])
                } else {
                    delete data[k]
                }
            })
            // Append the parcel object ID & the OLD ID to the form data object
            Reflect.set(data, 'PARCEL_ID', Number(parcelId))
            Reflect.set(data, 'LPIS_PARCEL_ID', Number(oldId))
            submitPermanentCrop(JSON.stringify(data))
        }
    }

    const renderGuideForm = () => {
        return <GuideForm id={_id} title='Нацртај парцела'
            finish={() => polygon._finishShape()}
            undo={() => polygon._removeLastVertex()}
            disable={disable}
        />
    }

    const renderForm = () => {
        return <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
            <DrawActions cancel={disable} />
        </Form>
    }

    const renderPermanentCropForm = () => {
        const { schema } = permanentCropSchema
        return <Form isSimple formTitle='Повеќегодишна култура'
            onSubmit={onPermanentCropSubmit}
            formData={permanentCropData}
            onChange={onPermanentCropChange}
            schema={schema}
        ><DrawActions cancel={disable} />
        </Form>
    }

    const renderComponent = () => {
        let componentToRender = null

        if (isGuided && !showForm && !showPermanentCropForm) {
            componentToRender = renderGuideForm()
        } else if (showForm && !isGuided && !showPermanentCropForm) {
            componentToRender = renderForm()
        } else if (showPermanentCropForm && !showForm && !isGuided) {
            componentToRender = renderPermanentCropForm()
        }

        return componentToRender
    }

    return <ProcessButton id={_id} onClick={enable} title='Нацртај парцела' className='mr-2'>
        <Icon name={_id} size='30px' />
        <span style={{ display: 'block', marginTop: '5px' }}>Нацртај</span>
        {processID === _id && renderComponent()}
        {saveIsPending && <Loading />}
    </ProcessButton>;
}

export const Draw = core.connect(state => ({
    processID: state.app.processID, saveIsPending: state.farmRegistry?.saveIsPending, farmObjId: state.farmRegistry?.farmObjId
}))(_Draw)
