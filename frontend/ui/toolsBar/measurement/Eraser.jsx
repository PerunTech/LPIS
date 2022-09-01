import { React } from 'perun-core';
import { core, ui } from '../../../Spatial';
import { ProcessButton } from '../ProcessButton';
import { length } from './Length';
import { area } from './Area';

const { Map } = core;
const { Icon } = ui;

/* The internal id of the process */
const _id = 'erase';

export const eraser = {
  clearMeasurementLayers: () => {
    Map.eachLayer(function (layer) {
      if (!!layer.toGeoJSON) {
        if (layer?.options?.showMeasurements && layer?._measurementOptions) {
          Map.removeLayer(layer);
        }
      }
    });
  },

  clearLength: () =>
    (length.sum = 0, length.measurements.clearLayers()),

  clearArea: () =>
    (area.sum = 0, area.measurements.clearLayers()),

  clearMeasurements: function () {
    this.clearLength();
    this.clearArea();
    this.clearMeasurementLayers();
  }
};

export const Eraser = (props) =>
  <ProcessButton {...props}
    id={_id}
    onClick={() => eraser.clearMeasurements()} >
    <Icon name={_id} size='28px' />
    <span style={{ display: 'block', marginTop: '5px' }}>Избриши мерења</span>
  </ProcessButton>;