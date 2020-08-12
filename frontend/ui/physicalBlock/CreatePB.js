import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core';
import { PROCESS_ENUM, DRAW_PB } from '../../config';
import { Metadata } from './Metadata';

const { Map, store } = spatial.core;
const { draw } = spatial.tools;
const {  Button, Icon, Modal, DrawActions } = spatial.ui;

export const createPB = {
    id: PROCESS_ENUM.createPB,

    enable () {
        store.dispatch({ processID: this.id });
        draw.polygon.enable(DRAW_PB);
    },

    disable () {
        store.dispatch({processID: ''});
        draw.polygon.disable('force');
    },
    
    render: ({processID, ...props}) => {
        const { id, enable, disable } = createPB;

        return <Button {...props}
            id={id} 
            className={processID === id ? 'active' : ''}
            onClick={enable.bind(createPB)} >
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
                                cancel={disable.bind(createPB)} />
                        </Modal.Title>
                        <Modal.Body >
                            <Metadata />
                        </Modal.Body>
                        <Modal.Footer >
                            <Button size='' className='end-measurement' onClick={disable.bind(createPB)} >Зачувај</Button>
                        </Modal.Footer>
                </Modal>}
        </Button>;
    }
}

createPB.render.displayName = 'CreatePB';
createPB.render.propTypes = {
    processID: PropTypes.string,
}