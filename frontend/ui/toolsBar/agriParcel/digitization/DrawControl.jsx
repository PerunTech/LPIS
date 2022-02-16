import { React, Loading, elements, redux } from 'perun-core';
import { core, ui, data, tools } from '../../../../Spatial';
import { config } from '../Config';
import { decodeResponse, getFarmMapAssets, strcmp } from '../../../Util';
import { saveParcel } from '../Save.js';
import { GuideForm } from '../GuideForm';
import { Form } from '../Form';
import { ProcessButton } from '../../ProcessButton';

const { Map, store, factory, http } = core;
const { geobuf, protobuf } = data;
const { draw: { polygon } } = tools;
const { Icon, DrawActions } = ui;
const { useReducer } = React;
const _id = 'drawAP';

const _DrawControl = ({ processID, farmObjId }) => {
    const [{ layer, data, loading, isGuided }, setState] = useReducer((currState, update) =>
        ({ ...currState, ...update }), { layer: {}, data: {}, loading: false, isGuided: false });

    const enable = () => {
        Map.on('new_shape', e => {
            if (e && e.layer) {
                setState({ layer: e.layer, isGuided: false })
                e.layer.addTo(Map)
            }
            Map.off('new_shape');
        });

        setState({ isGuided: true });
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
                setState({ layer: {}, data: {}, isGuided: false });
                store.dispatch({ processID: '' });

                // We remove the working geometry, save process will add the result.
                layer.removeFrom && layer.removeFrom(Map);
                // Disable draw handler.
                polygon.disable('force');

                // refresh spatial controls
                getFarmMapAssets();
            }
        }
    };

    const onChange = ({ formData }) => {
        setState({ data: { ...data, ...formData } });
    }

    const onSubmit = ({ formData }) => {
        saveParcel({
            ...data,
            ...formData,
            OBJECT_ID: 0,
            parent_id: farmObjId,
            GEOM: factory.GeoJSON.fromLayer(layer)
        }, disable);
    }


    return <ProcessButton id={_id} onClick={enable} >
        <Icon name={_id} size='30px' />
        <span style={{ display: 'block', marginTop: '5px' }}>Нацртај парцела</span>
        {processID === _id
            && (isGuided
                ? <GuideForm id={_id}
                    finish={() => polygon._finishShape()}
                    undo={() => polygon._removeLastVertex()}
                    disable={disable}
                    title='Нацртај просторна контрола' />
                : <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
                    <DrawActions
                        cancel={disable} />
                </Form>)}
        {loading && <Loading />}
    </ProcessButton>;
}

export const DrawControl = core.connect(state => ({
    processID: state.app.processID, mapId: state.map.id, farmObjId: state.farmRegistry?.farmObjId
}))(_DrawControl)
