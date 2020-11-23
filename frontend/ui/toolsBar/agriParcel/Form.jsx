import { React, PropTypes } from 'perun-core';
import { ui } from '../../../Spatial';
import { Main, Aux, Admin } from './Steps';

const { Button, Modal, Wizard } = ui;

export function Form ({onSubmit, data = {}, children }) {
    return <Modal show
        id='measure-dialog'
        backdrop={false}
        enforceFocus={false}
        container={document.getElementsByClassName('control-map')[0]} >
        <Modal.Title>
            <Button disabled className='as-label ap-modal-title' >Земјоделска Парцела</Button>
            { children }
        </Modal.Title>
        <Modal.Body className='ap-modal-body' >
            <Wizard >
                {[ <Main key='main' />, 
                    <Aux key='aux' />,
                    <Admin key='admin' />]}
            </Wizard>
        </Modal.Body>
    </Modal>;
}

Form.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    data: PropTypes.object,
    children: PropTypes.Node
}

