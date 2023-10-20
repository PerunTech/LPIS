import { React } from 'perun-core';
import { ui } from '../../../Spatial';
import { Import } from './Import';
import { Export } from './Export';
import { Erase } from './Erase';

const { ButtonGroup, Divider } = ui;

export const IO = () => {
  return (
    <ButtonGroup>
      <Import />
      <Divider />
      <Export />
      <Divider />
      <Erase />
    </ButtonGroup>
  );
}
