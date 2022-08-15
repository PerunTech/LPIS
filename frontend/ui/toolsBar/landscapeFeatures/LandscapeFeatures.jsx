import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../../Spatial';
import { Polygon } from './Polygon';
import { Line } from './Line';
import { Point } from './Point';

const { connect } = core;
const { ButtonGroup } = ui

const _LandscapeFeatures = () =>
  <ButtonGroup>
    <Polygon />
    <Line />
    <Point />
  </ButtonGroup>;

_LandscapeFeatures.propTypes = {
  processID: PropTypes.string,
  actionType: PropTypes.string,
}

export const LandscapeFeatures = connect(state =>
  ({ processID: state.app.processID, actionType: state.farmRegistry?.actionType }))(_LandscapeFeatures);
