import { React, elements } from 'perun-core';
import { ui } from '../../../../Spatial';
// Components
import { getFarmMapAssets } from '../../../Util';
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
import { Split } from './Split';

const { Button, ButtonGroup, Icon, Divider } = ui;

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
        <Button
            onClick={() => {
                getFarmMapAssets()
                elements.alertUser(true, 'success', 'Податоците се успешно освежени.')
            }}
            title='Освежи податоци'>
            <Icon name='refresh-control' size='30px' />
            <span style={{ display: 'block', marginTop: '5px' }}>Освежи податоци</span>
        </Button>
        <Divider />
        <Assign />
        <DeleteParcelFromFarm />
        <DeleteControl />
        <AddEditCommonUse />
    </ButtonGroup>;
