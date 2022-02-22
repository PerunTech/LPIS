import { React, Loading, elements } from 'perun-core';
import { core, ui, tools } from '../../../../Spatial';
import { config } from '../Config';
import { decodeResponse, getFarmMapAssets, strcmp } from '../../../Util';
import { saveAP } from '../SaveAP';
import { GuideForm } from '../GuideForm';
import { Form } from '../Form';
import { ProcessButton } from '../../ProcessButton';

const { Map, store, factory } = core;
const { draw: { polygon } } = tools;
const { Icon, DrawActions } = ui;
const { useReducer } = React;
const _id = 'drawAP';

const _DrawControl = ({ processID, farmObjId }) => {
    const [{ layer, data, loading, isGuided, showForm }, setState] = useReducer((currState, update) =>
        ({ ...currState, ...update }), { layer: {}, data: {}, loading: false, isGuided: false, showForm: false });

    const enable = () => {
        Map.on('new_shape', e => {
            if (e && e.layer) {
                setState({ layer: e.layer, isGuided: false, showForm: true })
                e.layer.addTo(Map)
            }
            Map.off('new_shape');
        });

        setState({ isGuided: true, showForm: false, data: {}, layer: {} });
        store.dispatch({ processID: _id });
        polygon.enable(config.pathOptions);
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
                // Reset state, internal and application-wide.
                setState({ layer: {}, data: {}, isGuided: false, showForm: false });
                store.dispatch({ processID: '' });

                // We remove the working geometry, save process will add the result.
                layer.removeFrom && layer.removeFrom(Map);
                // Disable draw handler.
                polygon.disable('force');
                // Refresh the data
                getFarmMapAssets();
            }
        }
    };

    const onChange = ({ formData }) => {
        setState({ data: { ...data, ...formData } });
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

    const renderGuideForm = () => {
        return <GuideForm id={_id}
            finish={() => polygon._finishShape()}
            undo={() => polygon._removeLastVertex()}
            disable={disable}
            title='Нацртај парцела'
        />
    }

    const renderForm = () => {
        return (
            <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
                <DrawActions cancel={disable} />
            </Form>
        )
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


    return <ProcessButton id={_id} onClick={enable} >
        <Icon name={_id} size='30px' />
        <span style={{ display: 'block', marginTop: '5px' }}>Нацртај парцела</span>
        {processID === _id && renderComponent()}
        {loading && <Loading />}
    </ProcessButton>;
}

export const DrawControl = core.connect(state => ({
    processID: state.app.processID, mapId: state.map.id, farmObjId: state.farmRegistry?.farmObjId
}))(_DrawControl)
