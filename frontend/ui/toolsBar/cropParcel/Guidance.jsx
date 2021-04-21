import { React, PropTypes } from 'perun-core';
import { ui } from '../../../Spatial';

const { Button, Icon, Modal, DrawActions } = ui;

export function Guidance ({id, title, msg, disable, finish, undo}) {
    const [isOpen, setOpen] = React.useState(false);

    return <Modal id='measure-dialog'
        show 
        backdrop={false}
        enforceFocus={false}
        container={document.getElementsByClassName('control-map')[0]} >
        <Modal.Title>
            <Button disabled className='as-label ap-modal-title' >{title}</Button>
            <DrawActions cancel={disable} finish={finish} undo={undo} />
        </Modal.Title>
        <Modal.Body className='ap-modal-body' >
            {isOpen 
                ? <>
                    <div id={id} >
                        {msg.map((text, i) => <div key={i}>{text}</div>)}
                    </div>
                    <Button className='help' onClick={() => setOpen(!isOpen)} >
                        <span style={{display: 'block', marginTop: '2px', marginRight: '3px' }}>Затвори Упатство</span>
                        <Icon name='help' size='18px' />
                    </Button>
                </>
                : <>
                    <Button className='help' onClick={() => setOpen(!isOpen)} >
                        <span style={{display: 'block', marginTop: '2px', marginRight: '3px' }}>Упатство</span>
                        <Icon name='help' size='18px' />
                    </Button>
                </> }

        </Modal.Body>
    </Modal>;
}

Guidance.propTypes = {
    id: PropTypes.string,
    title: PropTypes.string,
    msg: PropTypes.array,
    disable: PropTypes.func,
    finish: PropTypes.func,
    undo: PropTypes.func
}

