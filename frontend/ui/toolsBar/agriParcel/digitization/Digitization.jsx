import { React } from 'perun-core';
import { ui } from '../../../../Spatial';
import { Copy } from './Copy';
import { Cut } from './Cut';
import { DeleteControl } from './DeleteControl';
import { DrawControl } from './DrawControl';
import { Merge } from './Merge';
import { Split } from './Split';

const { ButtonGroup, Divider } = ui;

export const Digitization = () =>
    <ButtonGroup>
        <Copy />
        <DrawControl />
        <Divider />
        <Cut />
        <Split />
        <Merge />
        <DeleteControl />
    </ButtonGroup>;
