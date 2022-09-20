import { React } from 'perun-core';
import { ui } from '../../../Spatial';
import { Cut } from './Cut';
import { Fill } from './Fill';
import { Split } from './Split';
import { Merge } from './Merge';

const { ButtonGroup, Button, Icon } = ui;

export const AdvanceDigitization = () =>
  <ButtonGroup id='advance-digitization' >
    <Cut />
    <Fill />
    <Split />
    <Merge />
  </ButtonGroup>;
