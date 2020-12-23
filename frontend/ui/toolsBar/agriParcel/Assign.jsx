import { React, PropTypes } from 'perun-core';
import { ui } from '../../../Spatial';
import { Form } from './Form';

const { Button, Icon } = ui;
const _id = 'assignAP';

/**
 * Assign an agri parcel.
 */
export const Assign = ({ processID }) => {
    return <Button id={_id} onClick={() => {}} className={processID === _id ? 'active' : ''} >
        <Icon name={_id} size='28px' style={{marginTop: '2px'}} />
        <span style={{display: 'block', marginTop: '5px' }}>Назначи земјоделско стопанство</span>
        {processID === _id && <Form />}
    </Button>;
};

Assign.propTypes = {
    processID: PropTypes.string,
}