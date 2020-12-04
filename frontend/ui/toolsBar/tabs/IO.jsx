import { React } from 'perun-core';
import { ui } from '../../../Spatial';

const { ButtonGroup, Divider, Import, Export  } = ui;

export const IO = () => 
    <ButtonGroup>
        <Import />
        <Divider />
        <Export />
    </ButtonGroup>;