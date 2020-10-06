import { React } from 'perun-core';
import { spatial } from '../../core';

const { ButtonGroup, Divider, Import, Export  } = spatial.ui;

export const IO = () => 
    <ButtonGroup>
        <Import />
        <Divider />
        <Export />
    </ButtonGroup>;