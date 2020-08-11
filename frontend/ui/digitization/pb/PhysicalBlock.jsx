import { React, PropTypes } from 'perun-core';
import { spatial } from '../../../core';
import { PROCESS_ENUM, PB_DRAW } from '../../../config';
import { PBForm } from './PBForm';

const { Map, connect, store } = spatial.core;
const { draw } = spatial.tools;
const {  Button, Icon, Modal, DrawActions } = spatial.ui;

const _addPB = {
    /* The internal id of the process */
    id: PROCESS_ENUM.addPB,

    enable () {
        // Map.on('new_shape', this.disable.bind(this));
        store.dispatch({ processID: this.id });
        draw.polygon.enable(PB_DRAW);
    },

    disable () {
        Map.off('new_shape');
        store.dispatch({processID: ''});
        draw.polygon.disable('force');
    }
}

const _PhysicalBlock = ({processID, ...props}) => {
    const { id, enable, disable } = _addPB;

    return <>
        <Button {...props}
            id={id} 
            className={processID === id ? 'active' : ''}
            onClick={enable.bind(_addPB)} >
                <Icon name={id} size='34px' />
                <span style={{display: 'block', marginTop: '1px' }}>Додади физички блок</span>
                {processID === id
                    && <Modal show
                        id='measure-dialog'
                        backdrop={false} 
                        enforceFocus={false}
                        container={document.getElementsByClassName('control-map')[0]} >
                        <Modal.Title>
                            <Button disabled className='as-label pb-modal-title' >Физички Блок</Button>
                            <DrawActions
                                finish={() => draw.polygon._finishShape()} 
                                undo={() => draw.polygon._removeLastVertex()}
                                cancel={disable.bind(_addPB)} />
                        </Modal.Title>
                        <Modal.Body >
                            <PBForm />
                        </Modal.Body>
                        <Modal.Footer >
                            <Button size='' className='end-measurement' onClick={disable.bind(_addPB)} >Зачувај</Button>
                        </Modal.Footer>
                </Modal>}
        </Button>
        <Button >
            <Icon name='editPB' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Промени физички блок</span>
        </Button>
    </>;
}
_PhysicalBlock.propTypes = {
    processID: PropTypes.string,
}

export const PhysicalBlock = connect(({ app }) => { 
    return { 
        processID: app.processID,
    };
})(_PhysicalBlock);