import { React } from 'perun-core';
import { spatial } from '../../../core';
import { PB_SCHEMA, PB_UI_SCHEMA } from '../../../config';

const { Form } = spatial.ui;

export const Metadata = () => 
    <Form 
        schema={PB_SCHEMA} 
        uiSchema={PB_UI_SCHEMA} 
        formData={{ LAND_COVER_CODE: '200' }} >
        <span />
    </Form>;