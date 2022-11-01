import { React, elements } from 'perun-core';
import { config, core, tools, ui } from '../../../Spatial';
import { ProcessButton } from '../ProcessButton';
import { Guidance } from '../agriParcel/Guidance';
import { Form } from './Form';
import { config as cfg } from './Config';
import { decodeResponse } from '../../Util';

const { MIN_DIGI_SCALE, MAP_CONFIG } = config;
const { Map, store, factory, http, connect } = core;
const { edit } = tools;
const { Icon, DrawActions } = ui;
const { alertUser } = elements;
const { useReducer, useEffect } = React;

const _id = 'editBlock'
const _layerGroup = factory.layerGroup();

const _EditBlock = ({ processID, loadedPhysicalBlocks }) => {
  const [{ layer, isGuided, showForm }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }), { layer: {}, isGuided: false, showForm: false });

  useEffect(() => {
    return () => {
      Map.off('new_shape');
      edit.polygon.disable('force');
      store.dispatch({ minZoom: MAP_CONFIG.minZoom });
    }
  }, [])

  const initEdit = layer => {
    // set fields, disable all selection events on group.
    setState({ layer, isGuided: false, showForm: true })
    // publish active process, edit begins.
    store.dispatch({ processID: _id });
    //Move map view on top of selected polygon.
    Map.fitBounds(layer.getBounds());
    // Activate edit handler on selected polygon
    edit.polygon.enable(layer, cfg);
    // Activate edit event listeners on layer.
    layer.on('pm:edit', e => setState({ layer: e.target }));
  }

  const _setBlockEvents = layers => {
    Object.values(layers).forEach(layer => {
      layer.on('mouseover', function () { this.setStyle({ fillColor: '#FFFFFF' }) })
        .on('mouseout', function () { this.setStyle({ fillColor: '#000000' }) })
        .on('click', function () { initEdit(this); })
    })
  }

  const enable = () => {
    if (!Object.keys(loadedPhysicalBlocks).length > 0) {
      alertUser(true, 'info', 'Не се пронајдени вчитани физички блокови', 'Вчитајте физички блокови пред да ја користите алатката за уредување')
    } else {
      _layerGroup.addTo(Map);
      Map.setView(Map.getCenter(), MIN_DIGI_SCALE);
      store.dispatch({ minZoom: MIN_DIGI_SCALE })
      _setBlockEvents(loadedPhysicalBlocks)
      setState({ isGuided: true, renderForm: false })
    }
  }

  const disable = () => {
    _layerGroup.clearLayers().removeFrom(Map);
    setState({ layer: {}, isGuided: false, showForm: false })
    store.dispatch({ processID: '', minZoom: MAP_CONFIG.minZoom });
    edit.polygon.disable();
    Object.values(loadedPhysicalBlocks).forEach(layer => layer.off('mouseover mouseout click'))
  }

  const onSubmit = ({ formData }) => {
    const url = `/lpis/parcels/save/{init.token}/PHYSICAL_BLOCK/${layer.feature.id}/0/2/2/2`
    const data = JSON.stringify({
      ...formData,
      GEOM: factory.GeoJSON.fromLayer(layer),
    })
    http.call('save_pb', { data, url, method: 'post', responseType: 'arraybuffer' }).then(() => {
      disable();
      alertUser(true, 'success', 'Успешно зачувување', 'Физичкиот блок е запишан во базата на податоци.')
    }).catch((error) => {
      const { response } = error
      const errorMsg = decodeResponse(response)
      disable();
      alertUser(true, 'error', 'Грешка при зачувување', errorMsg);
    })
  }

  const renderGuideForm = () => {
    const msg = ['Одберете физички блок на мапата кој сакате да го уредите.', '']

    return (
      <Guidance id={_id} disable={() => disable()} msg={msg} title='Уреди физички блок' />
    )
  }

  const renderForm = () => {
    return (
      <Form onSubmit={onSubmit} data={layer.feature.properties} >
        <DrawActions cancel={disable} />
      </Form>
    )
  }

  const componentToRender = () => {
    let componentToRender = null

    if (isGuided && !showForm) {
      componentToRender = renderGuideForm()
    } else if (showForm && !isGuided) {
      componentToRender = renderForm()
    }

    return componentToRender
  }

  return (
    <ProcessButton
      id={_id}
      title='Уреди блок'
      onClick={enable} >
      <Icon name={_id} size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>Уреди блок</span>
      {processID === _id && componentToRender()}
    </ProcessButton>
  )
}

export const EditBlock = connect(state => ({
  processID: state.app.processID,
  loadedPhysicalBlocks: state.lpis?.loadedPhysicalBlocks,
}))(_EditBlock)
