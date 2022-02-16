import { React, PropTypes } from 'perun-core';
import { ui } from '../../../Spatial';

const { Button, Modal, DrawActions } = ui;

export function Guidance ({ id, title, msg, disable, finish, undo }) {
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
            <div id={id} >
                {msg.map((text, i) => <div key={i}>{text}</div>)}
            </div>
        </Modal.Body>
    </Modal>;
}

Guidance.propTypes = {
    id: PropTypes.string,
    title: PropTypes.string,
    msg: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    disable: PropTypes.func,
    finish: PropTypes.func,
    undo: PropTypes.func
}
