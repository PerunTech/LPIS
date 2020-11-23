import { React, PropTypes} from 'perun-core';
import { ui } from '../../../Spatial';
import { metadataMain, metadataAux, metadataAdmin } from './Config';

const { Form, Button } = ui;

/* Main Metadata */
export function Main ({formData, activeStep, totalSteps, prev, next, submit}) {
    return <Form schema={metadataMain.schema}
        uiSchema={metadataMain.uiSchema}
        formData={formData}
        onSubmit={() => activeStep() === totalSteps() ? submit() : next()} >
            <div id='formActions' >
                <Button type='submit' size='' className='next' > Наредно </Button>
            </div>
        </Form>;
}

Main.propTypes = {
    formData: PropTypes.any,
    activeStep: PropTypes.number,
    totalSteps: PropTypes.number,
    prev: PropTypes.func,
    next: PropTypes.func,
    submit: PropTypes.func
};

/* Aux Metadata */
export function Aux ({formData, activeStep, totalSteps, prev, next, submit}) {
    return <Form schema={metadataAux.schema}
        uiSchema={metadataAux.uiSchema}
        formData={formData}
        onSubmit={() => activeStep() === totalSteps() ? submit() : next()} >
            <div id='formActions' >
                <Button type='button' size='' className='prev' onClick={prev} > Претходно </Button>
                <Button type='submit' size='' className='next' > Наредно </Button>
            </div>
        </Form>;
}

Aux.propTypes = {
    formData: PropTypes.any,
    activeStep: PropTypes.number,
    totalSteps: PropTypes.number,
    prev: PropTypes.func,
    next: PropTypes.func,
    submit: PropTypes.func
};

/* Aux Metadata */
export function Admin ({formData, activeStep, totalSteps, prev, next, submit}) {
    return <Form schema={metadataAdmin.schema}
        uiSchema={metadataAdmin.uiSchema}
        formData={formData}
        onSubmit={() => activeStep() === totalSteps() ? submit() : next()} >
            <div id='formActions' >
                <Button type='button' size='' className='prev' onClick={prev} > Претходно </Button>
                <Button type='submit' size='' className='next' > Зачувај </Button>
            </div>
        </Form>;
}

Admin.propTypes = {
    formData: PropTypes.any,
    activeStep: PropTypes.number,
    totalSteps: PropTypes.number,
    prev: PropTypes.func,
    next: PropTypes.func,
    submit: PropTypes.func
};