import { React } from 'perun-core';
import { ui } from '../../../../Spatial';
// Components
import { CommonUse } from './CommonUse';
import { Assign } from './Assign';
import { Copy } from './Copy';
import { Cut } from './Cut';
import { Delete } from './Delete';
import { DeleteParcelFromFarm } from './DeleteParcelFromFarm';
import { Draw } from './Draw';
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
        <Draw />
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
        <CommonUse />
        <DeleteParcelFromFarm />
        <Delete />
    </ButtonGroup>;
