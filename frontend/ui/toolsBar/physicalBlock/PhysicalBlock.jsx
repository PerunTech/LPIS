import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../../Spatial';
import { Info } from './Info/Info';
import { AdvanceDigitization } from './Advance';
import { CreateBlock } from './Create';
import { Delete } from './Delete';
import { EditBlock } from './Edit';
import { restPB } from './Config';

const { connect, store } = core;
const { ButtonGroup, Divider } = ui

const _PhysicalBlock = ({ actionType }) =>
    <ButtonGroup>
        {actionType === 'sizp' && <Info />}
        {actionType !== 'sizp' && (
            <React.Fragment>
                <CreateBlock />
                <EditBlock />
                <Divider />
                <AdvanceDigitization name='физички блок' />
                <Divider />
                <Delete />
            </React.Fragment>
        )}
    </ButtonGroup>;

_PhysicalBlock.propTypes = {
    actionType: PropTypes.string,
}

export const PhysicalBlock = connect(state =>
    ({ actionType: state.farmRegistry?.actionType }))(_PhysicalBlock);

/* State slice extensions */
store.addState('http', restPB);