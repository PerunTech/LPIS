import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../../Spatial';
import { Info } from './Info/Info';
import { AdvanceDigitization } from './Advance';
import { createBlock } from './Create';
import { editBlock } from './Edit';
import { restPB } from './Config';

const { connect, store } = core;
const { ButtonGroup, Button, Icon, Divider } = ui

const _PhysicalBlock = ({ processID, actionType }) =>
    <ButtonGroup>
        <Info />
        {actionType !== 'sizp' && (
            <React.Fragment>
                <createBlock.render processID={processID} />
                <editBlock.render processID={processID} />
                <Divider />
                <AdvanceDigitization name='физички блок' />
                <Divider />
                <Button disabled>
                    <Icon name='deletePB' size='28px' style={{ marginTop: '2px' }} />
                    <span style={{ display: 'block', marginTop: '5px' }}>Избриши парцела</span>
                </Button>
            </React.Fragment>
        )}
    </ButtonGroup>;

_PhysicalBlock.propTypes = {
    processID: PropTypes.string,
    actionType: PropTypes.string,
}

export const PhysicalBlock = connect(state =>
    ({ processID: state.app.processID, actionType: state.farmRegistry?.actionType }))(_PhysicalBlock);

/* State slice extensions */
store.addState('http', restPB);