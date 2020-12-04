import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../../Spatial';
import { AdvanceDigitization } from './Advance';
import { createBlock } from './Create';
import { editBlock } from './Edit';
import { restPB } from './Config';

const { connect, store } = core;
const { ButtonGroup, Divider } = ui

const _PhysicalBlock = ({ processID }) => 
    <ButtonGroup>
        <createBlock.render processID={processID} />
        <editBlock.render processID={processID} />
        <Divider />
        <AdvanceDigitization name='физички блок' />
    </ButtonGroup>;

_PhysicalBlock.propTypes = {
    processID: PropTypes.string,
}

export const PhysicalBlock = connect(state => 
    ({ processID: state.app.processID }))(_PhysicalBlock);

/* State slice extensions */
store.addState('http', restPB);