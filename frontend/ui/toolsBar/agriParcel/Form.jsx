import { React, PropTypes } from 'perun-core';
import { ui } from '../../../Spatial';
import { Main, Aux, Admin } from './Steps';

const { Button, Modal, Wizard } = ui;

export function Form ({formData, onSubmit, onChange, children }) {
    return <Modal id='measure-dialog'
        show 
        backdrop={false}
        enforceFocus={false}
        container={document.getElementsByClassName('control-map')[0]} >
        <Modal.Title>
            <Button disabled className='as-label ap-modal-title' >Земјоделска Парцела</Button>
            { children }
        </Modal.Title>
        <Modal.Body className='ap-modal-body' >
            <Wizard >
                {[ <Main key='main' onChange={onChange} formData={formData} />, 
                    <Aux key='aux' onChange={onChange} formData={formData}/>,
                    <Admin key='admin' onChange={onChange} onSubmit={onSubmit} formData={formData}/>]}
            </Wizard>
        </Modal.Body>
    </Modal>;
}

Form.propTypes = {
    formData: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    children: PropTypes.Node
}

