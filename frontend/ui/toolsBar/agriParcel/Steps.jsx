import { React, PropTypes} from 'perun-core';
import { ui } from '../../../Spatial';
import { metadataMain, metadataAux, metadataAdmin } from './Config';

const { Form, Button } = ui;

/* Main Metadata */
export function Main ({formData, onChange, next}) {
    return <Form schema={metadataMain.schema}
        uiSchema={metadataMain.uiSchema}
        formData={formData}
        onChange={onChange}
        onSubmit={() => next()} >
            <div id='formActions' >
                <Button type='submit' size='' className='next' > Наредно </Button>
            </div>
        </Form>;
}

Main.propTypes = {
    formData: PropTypes.any,
    onChange: PropTypes.func,
    next: PropTypes.func,
};

/* Aux Metadata */
export function Aux ({formData, onChange, prev, next}) {
    return <Form schema={metadataAux.schema}
        uiSchema={metadataAux.uiSchema}
        formData={formData}
        onChange={onChange}
        onSubmit={() => next()} >
            <div id='formActions' >
                <Button type='button' size='' className='prev' onClick={prev} > Претходно </Button>
                <Button type='submit' size='' className='next' > Наредно </Button>
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
export function Admin ({formData, onChange, prev, onSubmit}) {
    return <Form schema={metadataAdmin.schema}
        uiSchema={metadataAdmin.uiSchema}
        formData={formData}
        onChange={onChange}
        onSubmit={onSubmit} >
            <div id='formActions' >
                <Button type='button' size='' className='prev' onClick={prev} > Претходно </Button>
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