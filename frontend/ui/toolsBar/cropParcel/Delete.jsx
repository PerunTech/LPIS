import { React, PropTypes, elements } from 'perun-core';
import { ui, core } from '../../../Spatial';
import { Guidance } from './Guidance';
import { deleteCPMsg } from './Config';
import { loadFarmerAssets } from '../..'

const { store } = core;
const { Button, Icon, DrawActions, Modal } = ui;
const _id = 'deleteCP';

/**
 * Delete an agri parcel.
 */
export const Delete = ({ processID, farmerId }) => {
    const [{isGuided, layer}, setState] = React.useReducer((currState, update) => 
        ({...currState, ...update}), { isGuided: false, layer: {} });

    const getLayer = e => {
        const objToDelete = e.target;
        if (objToDelete.feature.id) {
            core.http.call('getType', {
                url: '/ReactElements/getTableFormData/{init.token}/' + objToDelete.feature.id + '/LAND_USE_PLAN',
                method: 'get'
            })
            .then(response => {
                if (response.data.OBJECT_TYPE) {
                    const props = objToDelete.feature.properties
                    objToDelete.feature.properties = {
                        ...props,
                        OBJECT_ID: objToDelete.feature.id,
                        OBJECT_TYPE: response.data.OBJECT_TYPE
                    }

                    setState({layer: objToDelete, isGuided: false})
                } else {
                    disable();
                } 
            }).catch(err => console.log(err))
        }
    }

    const deleteLayer = () => {
        core.http.call('deleteCP', {
            url: '/ReactElements/deleteObject/{init.token}',
            method: 'post',
            data: JSON.stringify(layer.feature.properties)
        })
        .then(() => {
            loadFarmerAssets(core.store.getState().init.token, farmerId);
            elements.alertUser(true, 
                'success', 
                'Успешно бришење', 
                'Производната парцела е избришана од базата на податоци.');
            disable()
        }) // add alert)
        .catch(() => {
            elements.alertUser(true, 
                'error', 
                'Грешка при бришење', 
                'Производната парцела не е избришана од базата на податоци.');
                disable()
        }) // add alert);
    }

    const enable = () => {
        const layers = store.getState().data.layers;
        const cps = Object.values(layers).filter(layer => layer.getMetadata().type === 'land_use_plan');

        if (cps.length > 0) {
            store.dispatch({ processID: _id });
            setState({isGuided: true})

            cps.forEach(cp => (cp.bringToFront(), cp.on('click', getLayer)))
        } else {
            elements.alertUser(true, 
                'warning', 
                'Не се пронајдени производни парцели.', 
                'Додадете производни парцели со просторна определба пред да ја користите алатката за бришење.');
        }
        /*
        Map.eachLayer(function(layer) {
            console.log(layer.getMetadata().type)
            if (layer.toGeoJSON && layer.getMetadata().type === 'land_use_plan') {
                layer.on('click', getLayer)
            }
        });*/
    }

    const disable = () => {
        const layers = store.getState().data.layers;
        const cps = Object.values(layers).filter(layer => layer.getMetadata().type === 'land_use_plan');

        cps.forEach(cp => cp.off('click'))
/*
        Map.eachLayer(function(layer) {
            if (layer.toGeoJSON && layer.getMetadata().type === 'land_use_plan') {
                layer.off('click')
            }
        });*/

        // Reset state, internal and application-wide.
        store.dispatch({processID: ''});
        setState({ isGuided: false, layer: {} });
    }

    return <Button id={_id} onClick={() => enable()} className={processID === _id ? 'active' : ''} >
        <Icon name={_id} size='30px' />
        <span style={{display: 'block', marginTop: '2px' }}>Избриши производна парцела</span>
        {processID === _id 
            && (isGuided
                ? <Guidance id={_id} disable={disable} msg={deleteCPMsg} title='Избриши производна парцела' />
                : <Modal id='measure-dialog'
                    show 
                    backdrop={false}
                    enforceFocus={false}
                    container={document.getElementsByClassName('control-map')[0]} >
                    <Modal.Title>
                        <Button disabled className='as-label ap-modal-title' >Избриши производна парцела</Button>
                        <DrawActions cancel={disable} />
                    </Modal.Title>
                    <Modal.Body className='ap-modal-body' >
                        <div id={_id} >{'Ја избравте производната парцела со ид. број ' 
                            + layer.feature.id + ' и површина ' + Math.round(layer.getMeasurement()) + ' m². Дали сте сигурни дека сакате да ја избришете?'}</div>
                        <Button onClick={() => { deleteLayer() }} size='' className='cancel' > Избриши </Button>
                    </Modal.Body>
                </Modal>)}
    </Button>;
};

Delete.propTypes = {
    processID: PropTypes.string,
    farmerId: PropTypes.number
}
