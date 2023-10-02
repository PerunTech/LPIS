import { React, PropTypes } from 'perun-core';
import { ui } from '../../../Spatial';
import { getLabel, strcmp } from '../../Util'

const { useState } = React;
const { Form, Button } = ui;

/* Main Metadata */
export function Main({ formData, onChange, next, digitizationIsActive }) {
    const metadataMain = {
        type: 'agri_parcel',
        namePath: 'options.metadata.schema.properties.parent_id',
        schema: {
            properties: {
                OLD_ID: {
                    title: `${getLabel('lpis_number')}`,
                    type: 'integer',
                    default: 0
                },
                LAND_COVER_CODE: {
                    enum: ['200', '210', '310', '320', '410', '421', '422', '423', '430', '490', '600', '900'],
                    enumNames: [
                        `${getLabel('farmland')}`,
                        `${getLabel('greenhouse')}`,
                        `${getLabel('lawn')}`,
                        `${getLabel('pasture')}`,
                        `${getLabel('vineyard')}`,
                        `${getLabel('olive_grove')}`,
                        `${getLabel('orchard')}`,
                        `${getLabel('nuts')}`,
                        `${getLabel('fast_growing_plants')}`,
                        `${getLabel('mixed_permanent_crops')}`,
                        `${getLabel('stem_plants')}`,
                        `${getLabel('temporarily_uncultivated_land')}`
                    ],
                    maxLength: 50,
                    title: `${getLabel('land_use')}`,
                    type: 'string',
                    default: '200'
                },
                LAND_COVER_CODE_2: {
                    enum: ['0', '410', '421', '422', '423'],
                    enumNames: [' ', `${getLabel('vineyard')}`, `${getLabel('olive_grove')}`, `${getLabel('orchard')}`, `${getLabel('nuts')}`],
                    maxLength: 50,
                    title: `${getLabel('dominant_land_use')}`,
                    type: 'string',
                    default: '0'
                },
                HOME_NAME: {
                    maxLength: 2000,
                    title: `${getLabel('locality')}`,
                    type: 'string',
                    default: ''
                },
                NOTE_INSERT: {
                    maxLength: 2000,
                    title: `${getLabel('note')}`,
                    type: 'string',
                    default: ''
                },
                NOTE_FARMER: {
                    maxLength: 2000,
                    title: `${getLabel('farmer_note')}`,
                    type: 'string',
                    default: ''
                },
                NOTE_ORGANISATION: {
                    maxLength: 2000,
                    title: `${getLabel('organization_note')}`,
                    type: 'string',
                    default: ''
                },
            },
            required: ['LAND_COVER_CODE'],
            type: 'object',
        },
        uiSchema: {
            OLD_ID: { 'ui:disabled': true },
            LAND_COVER_CODE: {},
            LAND_COVER_CODE_2: { 'ui:disabled': true },
            NOTE_INSERT: { 'ui:widget': 'textarea' },
            NOTE_FARMER: { 'ui:widget': 'textarea' },
            NOTE_ORGANISATION: { 'ui:widget': 'textarea' }
        }
    };
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
        className='rjsf ap-form-main'
        disabled={!digitizationIsActive} >
        <div id='formActions' >
            <Button type='submit' size='' className='next' > {getLabel('next')} </Button>
        </div>
    </Form>;
}

Main.propTypes = {
    formData: PropTypes.any,
    onChange: PropTypes.func,
    next: PropTypes.func,
    digitizationIsActive: PropTypes.bool,
};

/* Aux Metadata */
export function Aux({ formData, onChange, prev, next, digitizationIsActive }) {
    const metadataAux = {
        type: 'agri_parcel',
        namePath: 'options.metadata.schema.properties.parent_id',
        schema: {
            properties: {
                CHANGED_BORDER: {
                    title: `${getLabel('changed_border')}`,
                    type: 'boolean',
                    default: false
                },
                LANDSCAPE_FEATURES: {
                    title: `${getLabel('landscape_features')}`,
                    type: 'boolean',
                    default: false
                },
                TERRACE: {
                    title: `${getLabel('terrace')}`,
                    type: 'boolean',
                    default: false
                },
                INVISIBLE_BORDER: {
                    title: `${getLabel('invisible_border')}`,
                    type: 'boolean',
                    default: false
                },
                IRRIGATION: {
                    title: `${getLabel('irrigation')}`,
                    type: 'boolean',
                    default: false
                },
                ELIGIBILITY_COEF: {
                    title: `${getLabel('eligibility_coef')}`,
                    type: 'integer',
                    enum: [25, 50, 75, 100],
                    enumNames: ['25%', '50%', '75%', '100%'],
                    default: 100,
                },
            },
            'type': 'object',
        },
        uiSchema: {
            SLOPE_AVG: { 'ui:disabled': true },
            Z_AVG: { 'ui:disabled': true },
        }
    };

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
        className='rjsf ap-form-aux'
        disabled={!digitizationIsActive} >
        <div id='formActions' >
            <Button type='button' size='' className='prev' onClick={prev} > {getLabel('previous')} </Button>
            <Button type='submit' size='' className='next' > {getLabel('next')} </Button>
        </div>
    </Form>;
}

Aux.propTypes = {
    formData: PropTypes.any,
    onChange: PropTypes.func,
    prev: PropTypes.func,
    next: PropTypes.func,
    digitizationIsActive: PropTypes.bool,
};

/* Admin Metadata */
export function Admin({ formData, onChange, prev, onSubmit, digitizationIsActive }) {
    const metadataAdmin = {
        type: 'agri_parcel',
        namePath: 'options.metadata.schema.properties.parent_id',
        schema: {
            properties: {
                EXPOSITION_AVG: {
                    title: `${getLabel('exposition_avg')}`,
                    type: 'integer',
                    minimum: 0,
                    maximum: 999,
                    default: 0
                },
                SLOPE_AVG: {
                    title: `${getLabel('slope_avg')}`,
                    type: 'number',
                    default: 0
                },
                Z_AVG: {
                    title: `${getLabel('z_avg')}`,
                    type: 'string',
                    default: '0'
                },
                ORGANIC: {
                    title: `${getLabel('organic')}`,
                    type: 'boolean',
                    default: false
                },
                COMMON_USE: {
                    title: `${getLabel('common_use')}`,
                    type: 'boolean',
                    default: false
                },
                CERTIFICATE_OF_USE: {
                    title: `${getLabel('certificate_of_use')}`,
                    type: 'boolean',
                    default: false
                },
                SOIL_TYPE: {
                    title: `${getLabel('soil_type')}`,
                    type: 'string',
                    default: ''
                },
            },
            type: 'object',
        },
        uiSchema: {
            EXPOSITION_AVG: { 'ui:widget': 'range', 'ui:disabled': true },
            COMMON_USE: { 'ui:disabled': true },
            SOIL_TYPE: { 'ui:disabled': true },
        }
    };

    return <Form schema={metadataAdmin.schema}
        uiSchema={metadataAdmin.uiSchema}
        formData={formData}
        onChange={onChange}
        onSubmit={onSubmit}
        className='rjsf ap-form-admin'
        disabled={!digitizationIsActive} >
        <div id='formActions' >
            <Button type='button' size='' className='prev' onClick={prev} > {getLabel('previous')} </Button>
            {digitizationIsActive && <Button type='submit' size='' className='next' > {getLabel('save')} </Button>}
        </div>
    </Form>;
}

Admin.propTypes = {
    formData: PropTypes.any,
    onChange: PropTypes.func,
    prev: PropTypes.func,
    onSubmit: PropTypes.func,
    digitizationIsActive: PropTypes.bool,
};