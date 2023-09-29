import { React, PropTypes } from 'perun-core';
import { core, tools, ui } from '../../../Spatial';
import { ProcessButton } from '../ProcessButton';
import { MEASURE_LENGTH } from './Config';
import { getLabel } from '../../Util';

const { factory, Map, connect, store } = core;
const { draw } = tools;
const { Button, Icon, Modal, DrawActions } = ui;

export const length = {
  /* The internal id of the process */
  id: 'length',

  /* The measurement sum of the action */
  sum: 0,

  /* Layer group of all length measurements */
  measurements: factory.layerGroup().addTo(Map),

  enable: function () {
    Map.on('new_shape', this._finishMeasurement.bind(this));
    store.dispatch({ processID: this.id });
    draw.line.enable(MEASURE_LENGTH);
  },

  disable: function () {
    this.sum = 0
    Map.off('new_shape');
    store.dispatch({ processID: '', totalLength: '0 m' });
    draw.line.disable('force');
  },

  _finishMeasurement: function (e) {
    if (e && e.layer) {
      this.measurements.addLayer(e.layer);
      this.sum = this.sum + this._calcCurrentLength(store.getState().measurement.totalLength)
    }
  },

  /* formats measurement to a number. Eg: converts string '45.2 km' to 45200 as number.
      Takes care of the unit of measurement of the input (km or m), always outputs in meters. */
  _calcCurrentLength: str =>
    Number(Array.from(str).filter(s =>
      '.0123456789'.split('').includes(s)).join('')) * (str.includes('km') ? 1000 : 1)
};

function _Length({ processID, currentMeasure, ..._props }) {
  const { id, sum, enable, disable } = length;

  return (
    <ProcessButton {..._props}
      id={id}
      className={processID === id ? 'active' : ''}
      onClick={enable.bind(length)} >
      <Icon name={id} size='28px' />
      <span style={{ display: 'block' }}>{getLabel('measure_length')}</span>
      {processID === id
        && <Modal show
          id='measure-dialog'
          backdrop={false}
          enforceFocus={false}
          container={document.getElementsByClassName('control-map')[0]} >
          <Modal.Title>
            <Button disabled className='as-label' >{getLabel('measured_length')}</Button>
            <DrawActions
              finish={() => draw.line._finishShape()}
              undo={() => draw.line._removeLastVertex()}
              cancel={disable.bind(length)} />
          </Modal.Title>
          <Modal.Body >
            <Button disabled size='lg' className='as-label' >{(sum + currentMeasure) + ' m'}</Button>
          </Modal.Body>
          {/* <Modal.Footer >
            <Button size='' className='end-measurement' onClick={() => (draw.line.disable('force'), draw.line.enable(MEASURE_LENGTH))}>Поништи</Button>
          </Modal.Footer> */}
        </Modal>}
    </ProcessButton>
  )
}

_Length.propTypes = {
  currentMeasure: PropTypes.number,
  processID: PropTypes.string,
}

export const Length = connect(({ app, measurement }) => {
  return {
    processID: app.processID,
    currentMeasure: length._calcCurrentLength(measurement.totalLength)
  };
})(_Length);