import { React, PropTypes } from 'perun-core';
import { ui } from '../../../Spatial';
import { Main, Aux, Admin } from './Steps';

const { Button, Modal, Wizard } = ui;

export function Form ({onSubmit, onChange, children }) {
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
                {[ <Main key='main' onChange={onChange} />, 
                    <Aux key='aux' onChange={onChange} />,
                    <Admin key='admin' onChange={onChange} onSubmit={onSubmit} />]}
            </Wizard>
        </Modal.Body>
    </Modal>;
}

Form.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    children: PropTypes.Node
}

