import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core';
import { PB_SCHEMA, PB_UI_SCHEMA } from '../../config';

const { Form, Button, Modal } = spatial.ui;

export function Metadata ({onSubmit, data = {}, children }) {
    return <Modal show
        id='measure-dialog'
        backdrop={false} 
        enforceFocus={false}
        container={document.getElementsByClassName('control-map')[0]} >
        <Modal.Title>
            <Button disabled className='as-label pb-modal-title' >Физички Блок</Button>
            { children }
        </Modal.Title>
        <Modal.Body className='pb-modal-body' >
            <Form 
                schema={PB_SCHEMA}
                uiSchema={PB_UI_SCHEMA}
                formData={data} 
                onSubmit={onSubmit}>
                <>
                <Button type='submit' size='' className='save-pb' >
                    Зачувај
                </Button>
                <Button size='sm' className='add-pb-to-list' >
                    Додади во работна листа
                </Button>
                </>
            </Form>
        </Modal.Body>
    </Modal>;
}

Metadata.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    data: PropTypes.object,
    children: PropTypes.Node
}

