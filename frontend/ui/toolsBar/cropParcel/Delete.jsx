import { React, PropTypes, elements } from 'perun-core';
import { ui, core } from '../../../Spatial';
import { Guidance } from './Guidance';
import { deleteCPMsg } from './Config';
import { ProcessButton } from '../..';
import { getFarmPPlanAssets, getLabel, getMeasurementUnit } from '../../Util';

const { Map, store } = core;
const { Button, Icon, DrawActions, Modal } = ui;
const _id = 'deleteCP';

const _Delete = ({ processID }) => {
    const [{ isGuided, layer }, setState] = React.useReducer((currState, update) =>
        ({ ...currState, ...update }), { isGuided: false, layer: {} });

    const getLayer = e => {
        const objToDelete = e.target;
        if (objToDelete.feature.id) {
            core.http.call('getType', {
                url: '/ReactElements/getTableFormData/{init.token}/' + objToDelete.feature.id + '/LAND_USE_PLAN',
                method: 'get'
            }).then(response => {
                if (response.data.OBJECT_TYPE) {
                    const props = objToDelete.feature.properties
                    objToDelete.feature.properties = {
                        ...props,
                        OBJECT_ID: objToDelete.feature.id,
                        OBJECT_TYPE: response.data.OBJECT_TYPE
                    }

                    setState({ layer: objToDelete, isGuided: false })
                } else {
                    disable();
                }
            }).catch(err => {
                console.error(err)
                const title = err?.response?.data?.title || err
                const message = err?.response?.data?.message || ''
                elements.alertUser(true, 'error', title, message);
                disable()
            })
        }
    }

    const deleteLayer = () => {
        core.http.call('deleteCP', {
            url: '/ReactElements/deleteObject/{init.token}',
            method: 'post',
            data: JSON.stringify(layer.feature.properties)
        }).then(() => {
            layer.removeFrom(Map);
            elements.alertUser(true, 'success', getLabel('delete_success'));
            disable()
        }).catch((err) => {
            console.error(err)
            const title = err?.response?.data?.title || err
            const message = err?.response?.data?.message || ''
            elements.alertUser(true, 'error', title, message);
            disable()
        })
    }

    const enable = () => {
        const cps = store.getState().farmRegistry?.farmPPlanData;
        if (cps.length > 0) {
            store.dispatch({ processID: _id });
            setState({ isGuided: true })
            cps.forEach(cp => (cp.bringToFront(), cp.on('click', getLayer)))
        } else {
            elements.alertUser(true, 'warning', getLabel('no_crop_parcels_found'), getLabel('add_crop_parcels_before_using_delete_tool'));
        }
    }

    const disable = () => {
        const cps = store.getState().farmRegistry?.farmPPlanData;
        cps.forEach(cp => cp.off('click'))

        // Reset state, internal and application-wide.
        store.dispatch({ processID: '', selectedParcelId: '', selectedCropParcelId: '' });
        setState({ isGuided: false, layer: {} });
        getFarmPPlanAssets()
    }

    return (
        <ProcessButton id={_id} onClick={() => enable()} >
            <Icon name={_id} size='30px' />
            <span style={{ display: 'block', marginTop: '2px' }}>{getLabel('delete_crop_parcel')}</span>
            {processID === _id
                && (isGuided
                    ? <Guidance id={_id} disable={disable} msg={deleteCPMsg} title={getLabel('delete_crop_parcel')} />
                    : <Modal id='measure-dialog'
                        show
                        backdrop={false}
                        enforceFocus={false}
                        container={document.getElementsByClassName('control-map')[0]} >
                        <Modal.Title>
                            <Button disabled className='as-label ap-modal-title' >{getLabel('delete_crop_parcel')}</Button>
                            <DrawActions cancel={disable} />
                        </Modal.Title>
                        <Modal.Body className='ap-modal-body' >
                            <div id={_id} >{`${getLabel('delete_crop_parcel_msg_one')} `
                                + layer.feature.id + ` ${getLabel('delete_crop_parcel_msg_two')} ` + Math.round(layer.getMeasurement()) + ` ${getMeasurementUnit(true)}. `
                                + ` ${getLabel('delete_crop_parcel_confirmation')} `}</div>
                            <Button onClick={() => { deleteLayer() }} size='' className='cancel' > {getLabel('delete')} </Button>
                        </Modal.Body>
                    </Modal>)}
        </ProcessButton>
    );
};

_Delete.propTypes = {
    processID: PropTypes.string,
    farmObjId: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
    ])
}

export const Delete = core.connect(state => ({
    farmObjId: state.farmRegistry?.farmObjId
}))(_Delete)
