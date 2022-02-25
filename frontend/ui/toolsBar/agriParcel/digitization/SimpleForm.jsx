import { React, PropTypes } from 'perun-core';
import { ui } from '../../../../Spatial';

const { Button, Form, Modal } = ui;

export function SimpleForm({ formTitle, schema, uiSchema, formData, onSubmit, onChange, children }) {
    const vFormTitle = formTitle;
    return <Modal id='simple-form'
        show
        backdrop={false}
        enforceFocus={false}
        container={document.getElementsByClassName('control-map')[0]} >
        <Modal.Title>
            <Button disabled className='as-label ap-modal-title' >{'Пополнете ја формата'}</Button>
            {children}
        </Modal.Title>
        <Modal.Body className='ap-modal-body' >
            <Form
                schema={schema}
                uiSchema={uiSchema}
                formData={{ ...formData }}
                onSubmit={onSubmit}
                onChange={onChange} >
                <Button type='submit' size='' className='save-cnt' >
                    Зачувај
                </Button>
            </Form>
        </Modal.Body>
    </Modal>;
}

SimpleForm.propTypes = {
    formTitle: PropTypes.string,
    schema: PropTypes.object,
    uiSchema: PropTypes.object,
    formData: PropTypes.object,
    onSubmit: PropTypes.func,
    onChange: PropTypes.func,
    children: PropTypes.node,
}
