import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core';

/* private local imports */
import { createPB } from './CreatePB';

const { connect, store } = spatial.core;
const {  Button, Icon } = spatial.ui;

const _PhysicalBlock = ({processID, ...props}) => {

    return <>
        <createPB.render {...props} processID={processID} />
        <Button >
            <Icon name='editPB' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Промени физички блок</span>
        </Button>
    </>;
}
_PhysicalBlock.propTypes = {
    processID: PropTypes.string,
}

export const PhysicalBlock = connect(state => 
    ({ processID: state.app.processID }))(_PhysicalBlock);

/* State slice extensions */
store.addState('http', {
    save_pb: {
        url: '/lpis/save/physicalBlock/{init.token}/0',
        method: 'post',
        responseType: 'text',
        contentType: 'text'
    }
})