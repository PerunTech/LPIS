import { React } from 'perun-core';
import { core, ui } from '../../../Spatial';
import { Info } from './Info/Info';
import { AdvanceDigitization } from './Advance';
import { CreateBlock } from './Create';
import { Delete } from './Delete';
import { Load } from './Load';
import { EditBlock } from './Edit';
import { restPB } from './Config';

const { connect, store } = core;
const { ButtonGroup, Divider } = ui

const _PhysicalBlock = ({ actionType }) =>
    <ButtonGroup>
        <Info />
        {actionType !== 'sizp' && (
            <React.Fragment>
                <CreateBlock />
                <EditBlock />
                <Divider />
                <AdvanceDigitization name='physical block' />
                <Divider />
                <Load />
                <Divider />
                <Delete />
            </React.Fragment>
        )}
    </ButtonGroup>;

export const PhysicalBlock = connect(state =>
    ({ actionType: state.farmRegistry?.actionType }))(_PhysicalBlock);

/* State slice extensions */
store.addState('http', restPB);