import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core';
import { PB_SCHEMA, PB_UI_SCHEMA } from '../../config';

const { http } = spatial.core;
const { draw } = spatial.tools;
const { Form, Button, Modal, DrawActions } = spatial.ui;

export function Metadata ({tool, data = {} }) {
    const onSubmit = ({ formData }) => {
        tool.disable.call(tool)
        http.call('save_pb', { data: JSON.stringify({ ...formData, GEOM: tool.feature }) });
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
                cancel={tool.disable.bind(tool)} />
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
    tool: PropTypes.object.isRequired,
    data: PropTypes.object
}

