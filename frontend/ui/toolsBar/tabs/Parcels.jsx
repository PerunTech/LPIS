import { React } from 'perun-core';
import { spatial } from '../../../core';
import { PhysicalBlock } from '../..';

const { ButtonGroup, Button, Icon, Divider } = spatial.ui

export const Parcels = () =>
    <ButtonGroup id='advance-digitization' >
        <PhysicalBlock />
        <Divider />
    </ButtonGroup>;