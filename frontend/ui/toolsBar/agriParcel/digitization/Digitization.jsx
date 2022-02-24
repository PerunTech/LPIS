import { React } from 'perun-core';
import { ui } from '../../../../Spatial';
// Components
import { AddEditCommonUse } from './AddEditCommonUse';
import { Assign } from './Assign';
import { Copy } from './Copy';
import { Cut } from './Cut';
import { DeleteControl } from './DeleteControl';
import { DeleteParcelFromFarm } from './DeleteParcelFromFarm';
import { DrawControl } from './DrawControl';
import { Edit } from './Edit';
import { Fill } from './Fill';
import { GetParcelInfo } from './GetParcelInfo';
import { Merge } from './Merge';
import { Refresh } from './Refresh';
import { Split } from './Split';

const { ButtonGroup, Divider } = ui;

export const Digitization = () =>
    <ButtonGroup>
        <Copy />
        <GetParcelInfo />
        <DrawControl />
        <Edit />
        <Divider />
        <Cut />
        <Split />
        <Merge />
        <Fill />
        <Divider />
        <Refresh />
        <Divider />
        <Assign />
        <DeleteParcelFromFarm />
        <DeleteControl />
        <AddEditCommonUse />
    </ButtonGroup>;
