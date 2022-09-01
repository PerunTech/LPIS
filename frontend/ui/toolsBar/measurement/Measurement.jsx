import { React } from 'perun-core';
import { ui } from '../../../Spatial';
import { Length } from './Length';
import { Area } from './Area';
import { Angle } from './Angle';
import { Radius } from './Radius';
import { Eraser } from './Eraser';

const { ButtonGroup, Divider } = ui;

export const Measurement = () =>
  <ButtonGroup id='measurement' >
    <Length />
    <Area />
    <Angle />
    <Radius />
    <Divider />
    <Eraser />
  </ButtonGroup>;