import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core';

/* private local imports */
import { createBlock } from './CreateBlock';
import { editBlock } from './EditBlock';

const { connect, store } = spatial.core;

const _PhysicalBlock = ({processID, ...props}) => 
    <>
        <createBlock.render {...props} processID={processID} />
        <editBlock.render {...props} processID={processID} />
    </>;

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

store.addState('http', {
    render_pb: {
        url: '/spatial/getGeometry/bbox/{init.token}/PHYSICAL_BLOCK/{map.bbox}',
        method: 'get',
        responseType: 'arraybuffer',
    }
})