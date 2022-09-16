import { React } from 'perun-core';
import { ui } from '../../../Spatial';
import { Import } from './Import';
import { Export } from './Export';

const { ButtonGroup, Divider } = ui;

export const IO = () =>
  <ButtonGroup>
    <Import />
    <Divider />
    <Export />
  </ButtonGroup>;
