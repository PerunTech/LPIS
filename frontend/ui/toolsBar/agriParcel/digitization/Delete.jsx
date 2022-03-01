import { React, elements, redux } from 'perun-core';
import { core, ui } from '../../../../Spatial';
import { deleteAPMsg } from '../Config';
import { getFarmMapAssets } from '../../../Util';
import { Guidance } from '../Guidance';
import { ProcessButton } from '../../ProcessButton';

const { Map, store, http } = core;
const { Button, Icon, DrawActions, Modal } = ui;
const { useReducer } = React;
const _id = 'deleteAP';

/**
 * Delete an agri parcel.
 */
const _Delete = ({ processID, farmObjId }) => {
    const [{ isGuided, layer }, setState] = useReducer((currState, update) =>
        ({ ...currState, ...update }), { isGuided: false, layer: {} });

    const deleteLayer = () => {
        http.call('deleteCP', {
            url: '/spatial/geometry/delete/confirm/{init.token}/' + Number(layer.feature.id) + '/' + Number(layer.feature.properties.type),
            method: 'post',
            data: JSON.stringify({
                ...layer.feature.properties,
                OBJECT_ID: Number(layer.feature.id),
                OBJECT_TYPE: Number(layer.feature.properties.type)
            })
        })
            .then(() => {
                layer.removeFrom(Map);
                elements.alertUser(true,
                    'success',
                    'Успешно бришење',
                    'Парцелата е избришана од базата на податоци.');
                disable()
            })
            .catch(() => {
                elements.alertUser(true,
                    'error',
                    'Грешка при бришење',
                    'Парцелата не е избришана од базата на податоци.');
                disable()
            })
    }

    const enable = () => {
        const layers = Object.values(store.getState().farmRegistry?.agriParcels);

        if (layers.length > 0) {
            store.dispatch({ processID: _id });
            setState({ isGuided: true })

            layers.forEach(sc => {
                sc.bringToFront();
                sc.on('click', function (e) {
                    setState({ layer: e.target, isGuided: false })
                })
            });
        } else {
            elements.alertUser(true,
                'warning',
                'Не се пронајдени парцели.',
                'Додадете парцели пред да ја користите алатката за бришење.');
        }
    }

    const disable = () => {
        /*
        const layers = store.getState().data.layers;
        const cps = Object.values(layers).filter(layer => layer.getMetadata().type === 'land_use_plan');

        cps.forEach(cp => cp.off('click'))*/

        // Reset state, internal and application-wide.
        store.dispatch({ processID: '' });
        setState({ isGuided: false, layer: {} });
        getFarmMapAssets();
    }

    return <ProcessButton id={_id} onClick={() => enable()} >
        <Icon name={_id} size='30px' />
        <span style={{ display: 'block', marginTop: '5px' }}>Избриши парцела</span>
        {processID === _id
            && (isGuided
                ? <Guidance id={_id} disable={disable} msg={deleteAPMsg} title='Избриши парцела' />
                : <Modal id='measure-dialog'
                    className='delete-control-dialog'
                    show
                    backdrop={false}
                    enforceFocus={false}
                    container={document.getElementsByClassName('control-map')[0]} >
                    <Modal.Title>
                        <Button disabled className='as-label ap-modal-title' >Избриши парцела</Button>
                        <DrawActions cancel={disable} />
                    </Modal.Title>
                    <Modal.Body className='ap-modal-body' >
                        <div id={_id} >{'Ја избравте парцелата со СИЗП број '
                            + layer.feature.id + ' и површина ' + Math.round(layer.getMeasurement()) + ' m². Дали сте сигурни дека сакате да ја избришете?'}</div>
                        <Button onClick={() => { deleteLayer() }} size='' className='cancel' > Избриши</Button>
                    </Modal.Body>
                </Modal>)}
    </ProcessButton>;
};

export const Delete = core.connect(state => ({
    processID: state.app.processID, mapId: state.map.id, farmObjId: state.farmRegistry?.farmObjId
}))(_Delete)
