import { React } from 'perun-core';
import { spatial } from '../../../core';
import { PhysicalBlock, AgriParcel, CropParcel } from '../..';

const { ButtonGroup, Divider } = spatial.ui

export const Parcels = () =>
    <ButtonGroup id='parcels' >
        <PhysicalBlock />
        <Divider />
        <AgriParcel />
        <Divider />
        <CropParcel />
    </ButtonGroup>;