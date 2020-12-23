import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../../Spatial';
import { AdvanceDigitization } from './Advance';
import { createBlock } from './Create';
import { editBlock } from './Edit';
import { restPB } from './Config';

const { connect, store } = core;
const { ButtonGroup, Button, Icon, Divider } = ui

const _PhysicalBlock = ({ processID }) => 
    <ButtonGroup>
        <createBlock.render processID={processID} />
        <editBlock.render processID={processID} />
        <Divider />
        <AdvanceDigitization name='физички блок' />
        <Divider />
        <Button disabled >
            <Icon name='deletePB' size='22px' style={{marginTop: '8px'}} />
            <span style={{display: 'block', marginTop: '5px' }}>Избриши парцела</span>
        </Button>
    </ButtonGroup>;

_PhysicalBlock.propTypes = {
    processID: PropTypes.string,
}

export const PhysicalBlock = connect(state => 
    ({ processID: state.app.processID }))(_PhysicalBlock);

/* State slice extensions */
store.addState('http', restPB);