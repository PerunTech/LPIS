import { React } from 'perun-core';
import { ui } from '../../../../Spatial';
import { ProcessButton } from '../../ProcessButton';
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
import { Info } from './Info/Info';
import { Merge } from './Merge';
import { Refresh } from './Refresh';
import { Split } from './Split';
import { PermanentCrops } from './PermanentCrops';

const { ButtonGroup, Divider } = ui;

export const Digitization = () => {
    return <ButtonGroup>
        <Info />
        <Divider />
        <Copy />
        <Draw />
        <Edit />
        <Cut />
        <Split />
        <Merge />
        <Fill />
        <Divider />
        <Refresh />
        <Divider />
        <Assign />
        <CommonUse />
        <PermanentCrops />
        <DeleteParcelFromFarm />
        <Delete />
    </ButtonGroup>;
}
