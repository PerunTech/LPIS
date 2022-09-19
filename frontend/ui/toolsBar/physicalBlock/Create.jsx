import { React, PropTypes, elements } from 'perun-core';
import { core, tools, ui } from '../../../Spatial';
import { ProcessButton } from '../ProcessButton';
import { Form } from './Form';
import { config } from './Config';

const { Map, store, factory, http } = core;
const { draw } = tools;
const { Icon, DrawActions } = ui;

/**
 * Create a physical block.
 */
export const createBlock = {
  _id: 'createBlock',
  _layer: {},

  enable () {
    Map.on('new_shape', this._finishShape.bind(this));
    store.dispatch({ processID: this._id });
    draw.polygon.enable(config);
  },

  disable () {
    Map.off('new_shape');
    store.dispatch({ processID: '' });
    this._layer.removeFrom && this._layer.removeFrom(Map);
    draw.polygon.disable('force');
  },

  _onSubmit ({ formData }) {
    http.call('save_pb', {
      data: JSON.stringify({
        ...formData,
        GEOM: factory.GeoJSON.fromLayer(this._layer)
      })
    }).then(() => {
      this.disable();
      elements.alertUser(true, 'success', 'Успешно зачувување', 'Физичкиот блок е запишан во базата на податоци.')
    }).catch(() => {
      this._layer.removeFrom(Map);
      this.disable();
      elements.alertUser(true, 'error', 'Грешка при зачувување', 'Физичкиот блок не е запишан во базата на податоци.')
    })
  },

  _finishShape (e) {
    (e && e.layer)
      && (this._layer = e.layer, e.layer.addTo(Map));
  },

  render ({ processID }) {
    const { _id, enable, disable, _onSubmit } = createBlock;

    return (
      <ProcessButton
        id={_id}
        className={processID === _id ? 'active' : ''}
        onClick={enable.bind(createBlock)} >
        <Icon name={_id} size='34px' />
        <span style={{ display: 'block', marginTop: '1px' }}>Нацртај блок</span>
        {processID === _id
          && <Form onSubmit={_onSubmit.bind(createBlock)} >
            <DrawActions
              finish={() => draw.polygon._finishShape()}
              undo={() => draw.polygon._removeLastVertex()}
              cancel={disable.bind(createBlock)} />
          </Form>}
      </ProcessButton>
    );
  }
}

createBlock.render.propTypes = {
  processID: PropTypes.string,
}
