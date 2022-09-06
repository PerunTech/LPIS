import { React } from 'perun-core';
import { ui } from '../../../../Spatial';
// Components
import { CommonUse } from './CommonUse';
import { Assign } from './Assign';
import { Copy } from './Copy';
import { CopyRefParcel } from './CopyRefParcel';
import { Cut } from './Cut';
import { Delete } from './Delete';
import { DeleteParcelFromFarm } from './DeleteParcelFromFarm';
import { Draw } from './Draw';
import { DrawWithLine } from './DrawWithLine';
import { Edit } from './Edit';
import { Fill } from './Fill';
import { Info } from './Info/Info';
import { Merge } from './Merge';
import { Refresh } from './Refresh';
import { Split } from './Split';
import { CalculateCadIntersections } from './CalculateCadIntersections';
import { CadIntersections } from './CadIntersections'
import { PermanentCrops } from './PermanentCrops';
import { Print } from './Print';
import { Load } from './Load';

const { ButtonGroup, Divider } = ui;

export const Digitization = () => {
    return <ButtonGroup>
        <Info />
        <Divider />
        <Copy />
        <CopyRefParcel />
        <Draw />
        <DrawWithLine />
        <Delete />
        <Edit />
        <Cut />
        <Split />
        <Merge />
        <Fill />
        <Divider />
        <Refresh />
        <Divider />
        <Load />
        <Divider />
        <Assign />
        <CommonUse />
        <PermanentCrops />
        <CalculateCadIntersections />
        <CadIntersections />
        <DeleteParcelFromFarm />
        <Divider />
        <Print />
    </ButtonGroup>;
}
