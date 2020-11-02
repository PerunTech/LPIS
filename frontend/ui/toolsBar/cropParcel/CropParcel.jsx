import { React, PropTypes } from 'perun-core';
import { spatial } from '../../../core';

const { connect } = spatial.core;
const { Button, Icon } = spatial.ui

const _CropParcel = ({processID, ...props}) => 
    <>
        <Button >
            <Icon name='createCP' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Додади производна парцела</span>
        </Button>
        <Button >
            <Icon name='editCP' size='30px' />
            <span style={{display: 'block', marginTop: '2px' }}>Промени производна парцела</span>
        </Button>
        <Button >
            <Icon name='cropPlan' size='30px' />
            <span style={{display: 'block', marginTop: '2px' }}>Производствен план</span>
        </Button>
    </>;

_CropParcel.propTypes = {
    processID: PropTypes.string,
}

export const CropParcel = connect(state => 
    ({ processID: state.app.processID }))(_CropParcel);