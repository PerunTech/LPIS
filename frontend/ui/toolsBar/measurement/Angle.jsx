import { React } from 'perun-core';
import { core, tools, ui } from '../../../Spatial';
import { MEASURE_CONFIG } from './Config';
import { getLabel } from '../../Util';

const { factory, Map, connect } = core;
const { draw } = tools;
const { Button, Icon } = ui;
const { useCallback } = React;

/* The internal id of the process */
const _id = 'angle';
/* Layer group of all Angle measurements, register is accessible from outside. */
export const angleMeasurements = factory.layerGroup().addTo(Map);

function _Angle({ options, ...props }) {
  const { processID, dispatch, ..._props } = props;

  /* Disables measurement handler. Called automatically on map event,
      fired when the drawn shape is finished. */
  const disable = useCallback((e) => {
    (e && e.layer)
      && (angleMeasurements.addLayer(e.layer),
        Map.fitBounds(e.layer.getBounds()).off('new_shape', disable));

    dispatch({ processID: '' });
    draw.circle.disable();
  }, [dispatch])

  /* Enables measurement handler */
  const enable = useCallback(() => {
    dispatch({ processID: _id });
    Map.on('new_shape', disable);
    draw.circle.enable({ ...MEASURE_CONFIG, ...options });
  }, [options, dispatch, disable])

  return (
    <Button disabled {..._props}
      id={_id}
      className={processID === _id ? 'active' : ''}
      onClick={() => enable()} >
      <Icon name={_id} size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('measure_angle')}</span>
    </Button>
  )
}

export const Angle = connect(({ app }) => {
  return { processID: app.processID };
})(_Angle);