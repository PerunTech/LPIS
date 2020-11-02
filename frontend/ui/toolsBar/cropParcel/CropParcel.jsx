import { React, PropTypes } from 'perun-core';
import { spatial } from '../../../core';

const { connect, store } = spatial.core;
const { ButtonGroup, Button, Icon, Divider } = spatial.ui

const _CropParcel = ({processID, ...props}) => 
    <>
        <Button >
            <Icon name='createCP' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Dodadi proizvodna parcela</span>
        </Button>
        <Button >
            <Icon name='editCP' size='30px' />
            <span style={{display: 'block', marginTop: '2px' }}>Promeni proizvodna parcela</span>
        </Button>
    </>;

_CropParcel.propTypes = {
    processID: PropTypes.string,
}

export const CropParcel = connect(state => 
    ({ processID: state.app.processID }))(_CropParcel);