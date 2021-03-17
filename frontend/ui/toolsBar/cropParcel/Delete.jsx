import { React, PropTypes, elements } from 'perun-core';
import { ui, core } from '../../../Spatial';
import { Guidance } from './Guidance';
import { deleteCPMsg } from './Config';
import { loadFarmerAssets } from '../..'

const { Map, store } = core;
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
        .then(response => {
            loadFarmerAssets(core.store.getState().init.token, farmerId);
            disable()
            elements.alertUser(true, 
                'success', 
                'Успешно бришење', 
                'Производната парцела е избришана од базата на податоци.');
        }) // add alert)
        .catch(err => {
            elements.alertUser(true, 
                'error', 
                'Грешка при бришење', 
                'Производната парцела не е избришана од базата на податоци.');
                disable()
        }) // add alert);
    }

    const enable = () => {
        store.dispatch({ processID: _id });
        setState({isGuided: true})

        const layers = store.getState().data.layers;
        const cps = Object.values(layers).filter(layer => layer.getMetadata().type === 'land_use_plan');

        cps.forEach(cp => (cp.bringToFront(), cp.on('click', getLayer)))
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
        setState({ isGuided: false, layer: {} });
        store.dispatch({processID: ''});
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
                        <div id={_id} >Дали сте сигурни дека сакате да ја избришете оваа производна парцела?</div>
                        <Button onClick={() => { deleteLayer() }} size='' className='cancel' > Избриши </Button>
                    </Modal.Body>
                </Modal>)}
    </Button>;
};

Delete.propTypes = {
    processID: PropTypes.string,
    farmerId: PropTypes.number
}
