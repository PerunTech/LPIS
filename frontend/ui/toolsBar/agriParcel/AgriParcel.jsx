import { React, PropTypes } from 'perun-core';
import { spatial } from '../../../core';

const { connect, store } = spatial.core;
const { ButtonGroup, Button, Icon, Divider } = spatial.ui

const _AgriParcel = ({processID, ...props}) => 
    <>
        <Button >
            <Icon name='createAP' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Додади земјоделска парцела</span>
        </Button>
        <Button >
            <Icon name='editAP' size='30px' />
            <span style={{display: 'block', marginTop: '2px' }}>Промени земјоделска парцела</span>
        </Button>
    </>;

_AgriParcel.propTypes = {
    processID: PropTypes.string,
}

export const AgriParcel = connect(state => 
    ({ processID: state.app.processID }))(_AgriParcel);