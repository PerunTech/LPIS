import { React, PropTypes } from 'perun-core';
import { ui } from '../../../Spatial';
import { metadata } from './Config';

const { Button, Modal } = ui;

export function Form ({formData, onSubmit, onChange, children, enumIdx, enumNames }) {
    const getSchema = () => {
        const cfg = metadata.schema
        const cropCode = { ...cfg.properties.CROP_CODE }
        cropCode.enum = [-1, ...enumIdx];
        cropCode.enumNames = ['Одбери...', ...enumNames];
        cropCode.default = -1// enumIdx[0] || 0
        cfg.properties.CROP_CODE = cropCode
        
        return { ...cfg  }
    }
    
    return <Modal id='measure-dialog'
        show 
        backdrop={false}
        enforceFocus={false}
        container={document.getElementsByClassName('control-map')[0]} >
        <Modal.Title>
            <Button disabled className='as-label ap-modal-title' >Производна Парцела</Button>
            { children }
        </Modal.Title>
        <Modal.Body className='ap-modal-body' >
            <ui.Form
                schema={getSchema()}
                uiSchema={metadata.uiSchema}
                formData={formData} 
                onSubmit={onSubmit}
                onChange={onChange} >
                <Button type='submit' size='' className='save-pb' >
                    Зачувај
                </Button>
            </ui.Form>
        </Modal.Body>
    </Modal>;
}

Form.propTypes = {
    formData: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    children: PropTypes.node,
    enumIdx: PropTypes.array,
    enumNames:PropTypes.array,
}

