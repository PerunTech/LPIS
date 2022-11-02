import { React, PropTypes } from 'perun-core';
import { ui } from '../../../Spatial';
import { metadataMain, metadataAux, metadataAdmin } from './Config';
import { strcmp } from '../../Util'

const { useState } = React;
const { Form, Button } = ui;

/* Main Metadata */
export function Main ({ formData, onChange, next }) {
    // This state key is for re-rendering the form
    const [state, toggleState] = useState(false)
    const data = formData
    const uiSchema = metadataMain.uiSchema
    if (data && data.LAND_COVER_CODE && !strcmp(data.LAND_COVER_CODE, '490')) {
        data.LAND_COVER_CODE_2 = '0'
        uiSchema.LAND_COVER_CODE_2 = { 'ui:disabled': true }
    } else {
        uiSchema.LAND_COVER_CODE_2 = {}
    }

    return <Form schema={metadataMain.schema}
        uiSchema={uiSchema}
        formData={data}
        onChange={(e) => {
            toggleState(!state)
            onChange(e)
        }}
        onSubmit={() => next()}
        className='rjsf ap-form-main' >
        <div id='formActions' >
            <Button type='submit' size='' className='next' > Следно </Button>
        </div>
    </Form>;
}

Main.propTypes = {
    formData: PropTypes.any,
    onChange: PropTypes.func,
    next: PropTypes.func,
};

/* Aux Metadata */
export function Aux ({ formData, onChange, prev, next }) {
    const data = formData
    const uiSchema = metadataAux.uiSchema
    if (data && data.LAND_COVER_CODE && !strcmp(data.LAND_COVER_CODE, '320')) {
        data.ELIGIBILITY_COEF = 100
        uiSchema.ELIGIBILITY_COEF = { 'ui:disabled': true }
    } else {
        uiSchema.ELIGIBILITY_COEF = {}
    }

    return <Form schema={metadataAux.schema}
        uiSchema={uiSchema}
        formData={data}
        onChange={onChange}
        onSubmit={() => next()}
        className='rjsf ap-form-aux' >
        <div id='formActions' >
            <Button type='button' size='' className='prev' onClick={prev} > Назад </Button>
            <Button type='submit' size='' className='next' > Следно </Button>
        </div>
    </Form>;
}

Aux.propTypes = {
    formData: PropTypes.any,
    onChange: PropTypes.func,
    prev: PropTypes.func,
    next: PropTypes.func,
};

/* Aux Metadata */
export function Admin ({ formData, onChange, prev, onSubmit }) {
    return <Form schema={metadataAdmin.schema}
        uiSchema={metadataAdmin.uiSchema}
        formData={formData}
        onChange={onChange}
        onSubmit={onSubmit}
        className='rjsf ap-form-admin' >
        <div id='formActions' >
            <Button type='button' size='' className='prev' onClick={prev} > Назад </Button>
            <Button type='submit' size='' className='next' > Зачувај </Button>
        </div>
    </Form>;
}

Admin.propTypes = {
    formData: PropTypes.any,
    onChange: PropTypes.func,
    prev: PropTypes.func,
    onSubmit: PropTypes.func
};