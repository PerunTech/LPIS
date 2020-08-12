import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core';
import { PB_SCHEMA, PB_UI_SCHEMA } from '../../config';

const { Form, Button, Modal, DrawActions } = spatial.ui;
const { draw } = spatial.tools;

export function Metadata ({action, data = {} }) {
    const { disable } = action;

    const onSubmit = ({ formData }) => {
        console.log(formData)
        disable.call(action)
    }
        

    return <Modal show
        id='measure-dialog'
        backdrop={false} 
        enforceFocus={false}
        container={document.getElementsByClassName('control-map')[0]} >
        <Modal.Title>
            <Button disabled className='as-label pb-modal-title' >Физички Блок</Button>
            <DrawActions
                finish={() => draw.polygon._finishShape()} 
                undo={() => draw.polygon._removeLastVertex()}
                cancel={disable.bind(action)} />
        </Modal.Title>
        <Modal.Body >
            <Form 
                schema={PB_SCHEMA}
                uiSchema={PB_UI_SCHEMA}
                formData={data} 
                onSubmit={onSubmit}>
                <Button type='submit' size='' className='end-measurement' >
                    Зачувај
                </Button>
            </Form>
        </Modal.Body>
    </Modal>;
}

Metadata.propTypes = {
    action: PropTypes.object.isRequired,
    data: PropTypes.object
}

