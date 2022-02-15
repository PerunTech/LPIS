import { React, PropTypes } from 'perun-core';
import { ui } from '../../../Spatial';

const { Button, Icon, Modal, DrawActions } = ui;

export function GuideForm ({ id, title, msg, disable, finish, undo }) {
  const [isOpen, setOpen] = React.useState(false);

  return <Modal id='otsc-guide-form'
    show
    backdrop={false}
    enforceFocus={false}
    container={document.getElementsByClassName('control-map')[0]} >
    <Modal.Title>
      <Button disabled className='as-label gf-modal-title' >{title}</Button>
      <Button className='help' onClick={() => setOpen(!isOpen)} >
        <Icon name='help' size='18px' />
      </Button>
      <DrawActions cancel={disable} finish={finish} undo={undo} />
    </Modal.Title>
    <Modal.Body className='gf-modal-body' >
      {isOpen
        && <div id={id} >
          {msg.map((text, i) => <div key={i}>{text}</div>)}
        </div>}
    </Modal.Body>
  </Modal>;
}

GuideForm.propTypes = {
  id: PropTypes.string,
  title: PropTypes.string,
  msg: PropTypes.array,
  disable: PropTypes.func,
  finish: PropTypes.func,
  undo: PropTypes.func
}
