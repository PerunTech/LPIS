import { React, elements } from 'perun-core';
import { config, core, data, tools, ui } from '../../../Spatial';
import { ProcessButton } from '../ProcessButton';
import { Guidance } from '../agriParcel/Guidance';
import { Form } from './Form';
import { config as cfg } from './Config';

const { MIN_DIGI_SCALE, MAP_CONFIG } = config;
const { Map, store, factory, http, connect } = core;
const { protobuf, geobuf } = data;
const { edit } = tools;
const { Icon, DrawActions } = ui;
const { alertUser } = elements;
const { useReducer } = React;

const _id = 'editBlock'
const _layerGroup = factory.layerGroup();

const _EditBlock = ({ processID }) => {
  const [{ layer, isGuided, showForm }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }), { layer: {}, isGuided: false, showForm: false });

  const _simplifyMultipolygon = layer => {
    let latlngArr = layer._latlngs
    let simpleLatlngArr = latlngArr[0];
    latlngArr.length = 0

    Object.keys(simpleLatlngArr).forEach(key => latlngArr.push(simpleLatlngArr[key]));

    return layer;
  }

  const initEdit = layer => {
    // set fields, disable all selection events on group.
    setState({ layer })
    _layerGroup.eachLayer(layer =>
      layer.off('mouseover mouseout click'));

    // publish active process, edit begins.
    store.dispatch({ processID: _id });

    //Move map view on top of selected polygon.
    Map.fitBounds(layer.getBounds());

    // Activate edit handler on selected polygon
    edit.polygon.enable(_simplifyMultipolygon(layer), cfg);

    // Activate edit event listeners on layer.
    layer.on('pm:edit', e => setState({ layer: e.target }));
  }

  const _setBlockEvents = layer => {
    layer.on('mouseover', function () { this.setStyle({ fillColor: '#FFFFFF' }) })
      .on('mouseout', function () { this.setStyle({ fillColor: '#000000' }) })
      .on('click', function () { initEdit(this); })
  }

  const _renderBlocks = jsonArr => {
    jsonArr.features.map(el => {
      factory.geoJSON(el, {
        onEachFeature: function (_feature, layer) {
          _setBlockEvents(layer);
          _layerGroup.addLayer(layer);
        }.bind(this),
      });
    })
  }

  const _fetchBlocks = () => {
    http.call('render_pb', {
      url: '/spatial/getGeometry/bbox/{init.token}/PHYSICAL_BLOCK/' + Map.getBBox(),
    }).then(response => {
      _renderBlocks(geobuf.decode(protobuf(response)));
    }).catch(err => {
      console.error(err);
      disable();
      alertUser(true, 'error', 'Грешка при вчитување физички блокови');
    })
  }

  const enable = () => {
    _layerGroup.addTo(Map);
    Map.setView(Map.getCenter(), MIN_DIGI_SCALE);
    store.dispatch({ minZoom: MIN_DIGI_SCALE })
    _fetchBlocks()
  }

  const disable = () => {
    _layerGroup.clearLayers().removeFrom(Map);
    setState({ layer: {}, isGuided: false, showForm: false })
    store.dispatch({ processID: '', minZoom: MAP_CONFIG.minZoom });
    edit.polygon.disable();
  }

  const onSubmit = ({ formData }) => {
    http.call('save_pb', {
      data: JSON.stringify({
        ...formData,
        GEOM: factory.GeoJSON.fromLayer(layer, Map.getCRS())
      }),
      url: '/lpis/save/physicalBlock/{init.token}/' + layer.feature.id
    }).then(() => {
      store.dispatch({ processID: _id });
      _layerGroup.removeLayer(layer);
      layer.addTo(Map);

      disable();
      alertUser(true, 'success', 'Успешно зачувување', 'Физичкиот блок е запишан во базата на податоци.')
    }).catch(() => {
      disable();
      alertUser(true, 'error', 'Грешка при зачувување', 'Физичкиот блок не е запишан во базата на податоци.');
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

export const EditBlock = connect(state => ({ processID: state.app.processID }))(_EditBlock)
