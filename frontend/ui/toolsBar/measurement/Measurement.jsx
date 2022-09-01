import { React } from 'perun-core';
import { ui } from '../../../Spatial';
import { Length } from './Length';
import { Area } from './Area';
import { Eraser } from './Eraser';

const { ButtonGroup, Divider } = ui;

export const Measurement = () =>
  <ButtonGroup id='measurement' >
    <Length />
    <Area />
    <Divider />
    <Eraser />
  </ButtonGroup>;