import { React, PropTypes } from 'perun-core';
import { core, tools, ui } from '../../../Spatial';
import { ProcessButton } from '../ProcessButton';
import { MEASURE_AREA } from './Config';

const { factory, Map, connect, store } = core;
const { draw } = tools;
const { Button, Icon, Modal, DrawActions } = ui;

export const area = {
  /* The internal id of the process */
  id: 'area',

  /* The measurements sum of the action */
  sum: 0,

  /* Layer group of all area measurements */
  measurements: factory.layerGroup().addTo(Map),

  enable: function () {
    Map.on('new_shape', this._finishMeasurement.bind(this));
    store.dispatch({ processID: this.id });
    draw.polygon.enable(MEASURE_AREA);
  },

  disable: function () {
    this.sum = 0;
    Map.off('new_shape');
    store.dispatch({ processID: '', totalArea: '0 m²' });
    draw.polygon.disable('force');
  },

  _finishMeasurement: function (e) {
    if (e && e.layer) {
      this.measurements.addLayer(e.layer);
      this.sum = this.sum + this._calcCurrentArea(store.getState().measurement.totalArea);
    }
  },

  _calcCurrentArea: str =>
    Number(Array.from(str).filter(s =>
      '.0123456789'.split('').includes(s)).join('')) * (str.includes('km') ? 1000000 : 1)
}

function _Area ({ processID, currentMeasure, ..._props }) {
  const { id, sum, enable, disable } = area;

  return (
    <ProcessButton {..._props}
      id={id}
      className={processID === id ? 'active' : ''}
      onClick={enable.bind(area)} >
      <Icon name='measure-area' size='28px' />
      <span style={{ display: 'block', marginTop: '5px' }}>Измери површина</span>
      {processID === id
        && <Modal show
          id='measure-dialog'
          backdrop={false}
          enforceFocus={false}
          container={document.getElementsByClassName('control-map')[0]} >
          <Modal.Title>
            <Button disabled className='as-label' >Измерена површина</Button>
            <DrawActions
              finish={() => draw.polygon._finishShape()}
              undo={() => draw.polygon._removeLastVertex()}
              cancel={() => (draw.polygon.disable('force'), draw.polygon.enable(MEASURE_AREA))} />
          </Modal.Title>
          <Modal.Body >
            <Button disabled size='lg' className='as-label' >{(sum + currentMeasure) + ' m²'}</Button>
          </Modal.Body>
          <Modal.Footer >
            <Button size='' className='end-measurement' onClick={disable.bind(area)} >Затвори</Button>
          </Modal.Footer>
        </Modal>}
    </ProcessButton>
  )
}

_Area.propTypes = {
  currentMeasure: PropTypes.number,
  processID: PropTypes.string,
}

export const Area = connect(({ app, measurement }) => {
  return {
    processID: app.processID,
    currentMeasure: area._calcCurrentArea(measurement.totalArea)
  };
})(_Area);