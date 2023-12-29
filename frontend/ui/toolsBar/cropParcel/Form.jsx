import { React, PropTypes } from 'perun-core';
import { ui, core } from '../../../Spatial';
import { getLabel } from '../../Util';

const { Button, Modal } = ui;
const { store } = core;

export function Form({ formData, onSubmit, onChange, children, enumIdx, enumNames }) {
    const cropCodes = store.getState()?.cropCodes
    const metadata = {
        type: 'land_use_plan',
        namePath: 'feature.properties.parent_id',
        schema: {
            properties: {
                CROP_CODE: {
                    enum: Object.keys(cropCodes),
                    enumNames: Object.values(cropCodes),
                    title: `${getLabel('crop')}`,
                    type: 'number',
                    default: enumIdx[0],
                },
                AREA: {
                    title: `${getLabel('area')}`,
                    type: 'number',
                    default: 0
                },
                NUMBER_PLANTS: {
                    title: `${getLabel('number_of_plants')}`,
                    type: 'number',
                },
                IS_ORGANIC: {
                    title: `${getLabel('organic')}`,
                    type: 'boolean',
                    default: false
                },
            },
            /*required: ['CROP_CODE'],*/
            'type': 'object',
        },
        uiSchema: {
            AREA: { 'ui:disabled': true },
        }
    }

    const getSchema = () => {
        const cfg = metadata.schema
        const cropCode = { ...cfg.properties.CROP_CODE }
        cropCode.enum = ['', ...enumIdx];
        cropCode.enumNames = ['', ...enumNames];
        cfg.properties.CROP_CODE = cropCode

        return { ...cfg }
    }

    return (
        <Modal id='measure-dialog'
            show
            backdrop={false}
            enforceFocus={false}
            container={document.getElementsByClassName('control-map')[0]} >
            <Modal.Title>
                <Button disabled className='as-label ap-modal-title' >{getLabel('crop_parcel')}</Button>
                {children}
            </Modal.Title>
            <Modal.Body className='ap-modal-body cp-modal-body' >
                <ui.Form
                    schema={getSchema()}
                    uiSchema={metadata.uiSchema}
                    formData={formData}
                    onSubmit={onSubmit}
                    onChange={onChange} >
                    <Button type='submit' size='' className='save-pb' >
                        {getLabel('save')}
                    </Button>
                </ui.Form>
            </Modal.Body>
        </Modal>
    );
}

Form.propTypes = {
    formData: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    children: PropTypes.node,
    enumIdx: PropTypes.array,
    enumNames: PropTypes.array,
}
