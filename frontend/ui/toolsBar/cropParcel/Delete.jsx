import { React, PropTypes } from 'perun-core';
import { ui, core } from '../../../Spatial';
import { Form } from './Form';
import { Guidance } from './Guidance';
import { deleteCPMsg } from './Config';

const { Map, store } = core;
const { Button, Icon, DrawActions, Modal } = ui;
const _id = 'deleteCP';

/**
 * Delete an agri parcel.
 */
export const Delete = ({ processID }) => {
    const [{isGuided, layer}, setState] = React.useReducer((currState, update) => 
        ({...currState, ...update}), { isGuided: false, layer: {} });

    const getLayer = e => setState({layer: e.target, isGuided: false})

    const enable = () => {
        store.dispatch({ processID: _id });
        setState({isGuided: true})

        Map.eachLayer(function(layer) {
            if (layer.toGeoJSON) {
                layer.on('click', getLayer)
            }
        });
    }

    const disable = () => {
        Map.eachLayer(function(layer) {
            if (layer.toGeoJSON) {
                layer.off('click')
            }
        });

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
                        <Button onClick={() => { layer.removeFrom(Map); disable(); }} size='' className='cancel' > Избриши </Button>
                    </Modal.Body>
                </Modal>)}
    </Button>;
};

Delete.propTypes = {
    processID: PropTypes.string,
}
