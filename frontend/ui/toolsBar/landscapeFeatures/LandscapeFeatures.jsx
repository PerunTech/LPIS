import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../../Spatial';
import { Polygon } from './Polygon';
import { EditPolygon } from './EditPolygon';
import { Line } from './Line';
import { EditLine } from './EditLine';
import { Point } from './Point';
import { EditPoint } from './EditPoint';
import { Load } from './Load';

const { connect } = core;
const { ButtonGroup, Divider } = ui

const _LandscapeFeatures = () =>
  <ButtonGroup>
    <Polygon />
    <EditPolygon />
    <Divider />
    <Line />
    <EditLine />
    <Divider />
    <Point />
    <EditPoint />
    <Divider />
    <Load />
  </ButtonGroup>;

_LandscapeFeatures.propTypes = {
  processID: PropTypes.string,
  actionType: PropTypes.string,
}

export const LandscapeFeatures = connect(state =>
  ({ processID: state.app.processID, actionType: state.farmRegistry?.actionType }))(_LandscapeFeatures);
