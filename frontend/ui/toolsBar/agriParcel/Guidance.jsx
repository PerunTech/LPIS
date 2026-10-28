import { React } from 'perun-core';
import { ui } from '../../../Spatial';

const { Button, Modal, DrawActions } = ui;

export function Guidance ({ id, title, msg, disable, finish, undo, children }) {
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
            {children}
        </Modal.Body>
    </Modal>;
}
