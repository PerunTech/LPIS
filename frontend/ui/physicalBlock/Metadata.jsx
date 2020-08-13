import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core';
import { PB_SCHEMA, PB_UI_SCHEMA } from '../../config';

const { http } = spatial.core;
const { draw } = spatial.tools;
const { Form, Button, Modal, DrawActions } = spatial.ui;

export function Metadata ({action, data = {} }) {
    const onSubmit = ({ formData }) => {
        action.disable.call(action)
        http.call('save_pb', { data: JSON.stringify({ ...formData, GEOM: '' }) });
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
                cancel={action.disable.bind(action)} />
        </Modal.Title>
        <Modal.Body >
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
    action: PropTypes.object.isRequired,
    data: PropTypes.object
}

