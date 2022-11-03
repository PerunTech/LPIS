import { React, PropTypes } from 'perun-core';
import { ui } from '../../../Spatial';
import { metadata } from './Config';

const { Button, Modal } = ui;

export function Form ({ onSubmit, onChange, data = {}, children }) {
    return <Modal show
        id='measure-dialog'
        backdrop={false}
        enforceFocus={false}
        container={document.getElementsByClassName('control-map')[0]} >
        <Modal.Title>
            <Button disabled className='as-label pb-modal-title' >Физички Блок</Button>
            {children}
        </Modal.Title>
        <Modal.Body className='pb-modal-body' >
            <ui.Form
                schema={metadata.schema}
                uiSchema={metadata.uiSchema}
                formData={data}
                onSubmit={onSubmit}
                onChange={onChange}>
                <Button type='submit' size='' className='save-pb' >
                    Зачувај
                </Button>
            </ui.Form>
        </Modal.Body>
    </Modal>;
}

Form.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    data: PropTypes.object,
    children: PropTypes.Node
}
