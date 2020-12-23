import { React, PropTypes } from 'perun-core';
import { ui } from '../../../Spatial';
import { Form } from './Form';

const { Button, Icon } = ui;
const _id = 'deleteAP';

/**
 * Delete an agri parcel.
 */
export const Delete = ({ processID }) => {
    return <Button id={_id} onClick={() => {}} className={processID === _id ? 'active' : ''} >
        <Icon name={_id} size='22px' style={{marginTop: '8px'}} />
        <span style={{display: 'block', marginTop: '5px' }}>Избриши парцела</span>
        {processID === _id && <Form />}
    </Button>;
};

Delete.propTypes = {
    processID: PropTypes.string,
}