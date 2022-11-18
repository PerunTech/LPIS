import { React, Loading, elements } from 'perun-core';
import { config, core, tools, ui } from '../../../Spatial';
import { ProcessButton } from '../ProcessButton';
import { Guidance } from '../agriParcel/Guidance';
import { Form } from './Form';
import { config as cfg } from './Config';
import { decodeResponse } from '../../Util';
import { getPhysicalBlockInfo } from './Load';

const { MIN_DIGI_SCALE, MAP_CONFIG } = config;
const { Map, store, factory, http, connect } = core;
const { edit } = tools;
const { Icon, DrawActions } = ui;
const { alertUser } = elements;
const { useReducer, useEffect } = React;

const _id = 'editBlock'
const _layerGroup = factory.layerGroup();

const _EditBlock = ({ processID, loadedPhysicalBlocks }) => {
  const [{ loading, layer, data, isGuided, showForm }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }), { loading: false, layer: {}, data: {}, isGuided: false, showForm: false });

  useEffect(() => {
    return () => {
      Map.off('new_shape');
      edit.polygon.disable('force');
      store.dispatch({ minZoom: MAP_CONFIG.minZoom });
    }
  }, [])

  const initEdit = layer => {
    // set fields, disable all selection events on group.
    setState({ loading: false, layer, data: layer.feature.properties, isGuided: false, showForm: true })
    // Activate edit handler on selected polygon
    edit.polygon.enable(layer, cfg);
    // Activate edit event listeners on layer.
    layer.on('pm:edit', e => setState({ layer: e.target }));
  }

  const _setBlockEvents = layers => {
    Object.values(layers).forEach(layer => {
      layer.on('mouseover', function () { this.setStyle({ fillColor: '#000000' }) })
        .on('mouseout', function () { this.setStyle({ fillColor: '#f8f8ff' }) })
        .on('click', function () { initEdit(this); })
    })
  }

  const enable = () => {
    if (!Object.keys(loadedPhysicalBlocks).length > 0) {
      alertUser(true, 'info', 'Не се пронајдени вчитани физички блокови', 'Вчитајте физички блокови пред да ја користите алатката за уредување')
    } else {
      _layerGroup.addTo(Map);
      store.dispatch({ minZoom: MIN_DIGI_SCALE })
      _setBlockEvents(loadedPhysicalBlocks)
      store.dispatch({ processID: _id })
      setState({ isGuided: true, showForm: false })
    }
  }

  const disable = () => {
    if (Object.keys(layer).length > 0) {
      Object.values(loadedPhysicalBlocks).forEach(loadedLayer => {
        loadedLayer.off('mouseover mouseout click')
        if (loadedLayer.feature.id === layer.feature.id) {
          // Remove the loaded layer from the map & from the loadedPhysicalBlocks object
          loadedLayer.removeFrom(Map)
          Reflect.deleteProperty(loadedPhysicalBlocks, loadedLayer.feature.id)
          // Get the layer once again, using the point as the WS param
          getPhysicalBlockInfo(loadedLayer.feature.point)
        }
      })
    }
    _layerGroup.clearLayers().removeFrom(Map);
    setState({ loading: false, layer: {}, data: {}, isGuided: false, showForm: false })
    store.dispatch({ processID: '', minZoom: MAP_CONFIG.minZoom });
    edit.polygon.disable();
  }

  const onChange = ({ formData }) => {
    setState({ data: { ...data, ...formData } });
  }

  const onSubmit = ({ formData }) => {
    setState({ loading: true, showForm: false })
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
      const errorMsg = decodeResponse(response, 'physical_block')
      disable();
      alertUser(true, 'error', 'Грешка при зачувување', errorMsg);
    })
  }

  const renderGuideForm = () => {
    const msg = ['Одберете физички блок на мапата кој сакате да го уредите.', '']

    return (
      <Guidance id={_id} disable={() => disable(false)} msg={msg} title='Уреди физички блок' />
    )
  }

  const renderForm = () => {
    return (
      <Form onSubmit={onSubmit} onChange={onChange} data={data} >
        <DrawActions cancel={() => disable(false)} />
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
      {loading && <Loading />}
    </ProcessButton>
  )
}

export const EditBlock = connect(state => ({
  processID: state.app.processID,
  loadedPhysicalBlocks: state.lpis?.loadedPhysicalBlocks,
}))(_EditBlock)
