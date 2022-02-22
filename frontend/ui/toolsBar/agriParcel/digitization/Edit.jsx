import { React, Loading, elements } from 'perun-core';
import { core, ui, data, tools, config as cfg } from '../../../../Spatial';
import { config, editAPMsg } from '../Config';
import { getFarmMapAssets } from '../../../Util';
import { saveAP } from '../SaveAP';
import { GuideForm } from '../GuideForm';
import { Form } from '../Form';
import { ProcessButton } from '../../ProcessButton';

const { MIN_DIGI_SCALE, MAP_CONFIG } = cfg;
const { Map, store, factory, http, util } = core;
const { geobuf, protobuf } = data;
const { edit } = tools;
const { Icon, DrawActions } = ui;
const { useReducer } = React;

const _id = 'editAP';
const _layerGroup = factory.layerGroup();
const _style = { color: '#eed000', fillColor: '#FFFFFF' };

const _Edit = ({ processID, farmObjId, agriParcels }) => {
  const [{ layer, data, loading, isGuided, showForm }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }), { layer: {}, data: {}, loading: false, isGuided: false, showForm: false });

  const enable = () => {
    if (agriParcels.length > 0) {
      agriParcels.forEach(sc => _setBlockEvents(sc, agriParcels))
      store.dispatch({ processID: _id, minZoom: MIN_DIGI_SCALE });
      setState({ isGuided: true, showForm: false, data: {}, layer: {} })
      _editAP()
    } else {
      elements.alertUser(true,
        'warning',
        'Не се пронајдени земјоделски парцели.',
        'Додадете земјоделски парцели пред да ја користите алатката за менување.',
        () => disable());
    }
  };

  const disable = () => {
    Map.off('click');
    // Reset state, internal and application-wide.
    setState({ layer: {}, data: {}, isGuided: false, showForm: false, loading: false });
    store.dispatch({ processID: '', minZoom: MAP_CONFIG.minZoom });
    // We remove the working geometry, save process will add the result.
    layer.removeFrom && layer.removeFrom(Map);
    getFarmMapAssets()
    _stopEditAP()
  }

  const _editAP = () => {
    const currZoom = Map.getZoom();
    // This line ensures no racing codition on the current bounding box.
    // We set view manually before calling Map.getBBox in _fetchBlocks and bbox will NOT contain a whole country.
    Map.setView(Map.getCenter(), currZoom < MIN_DIGI_SCALE ? MIN_DIGI_SCALE : currZoom); // zoom is inverse to scale
    _layerGroup.addTo(Map);
  }

  const _stopEditAP = () => {
    _layerGroup.clearLayers().removeFrom(Map);
    edit.polygon.disable();
  }

  const _fetchBlocks = id => {
    http.call('render_pb', {
      url: '/spatial/geometry/get/bbox/{init.token}/AGRI_PARCEL/' + Map.getBBox(),
    })
      .then(response => _renderBlocks(id, geobuf.decode(protobuf(response))))
      .catch(err => console.log(err));
  }

  const _renderBlocks = (id, jsonArr) => {
    // filter layers, remove old app layers entries, will update with the new geojson set.
    const mapLayers = store.getState().farmRegistry?.agriParcels;

    jsonArr.features.map(feature => {
      mapLayers[feature.id] && mapLayers[feature.id].removeFrom(Map);

      factory.geoJSON(feature, {
        onEachFeature: function (feature, layer) {
          id === _id && _setBlockEvents(layer);
          _layerGroup.addLayer(layer);
        },
        style: _style
      });
    })
  }

  const _setBlockEvents = (layer, agriParcels) => {
    layer.on('mouseover', function () { this.setStyle({ color: '#eed000', fillColor: '#000000' }) })
      .on('mouseout', function () { this.setStyle({ color: '#3399ff', fillColor: '#3388ff' }) })
      .on('click', function () {
        initEdit(this);
        agriParcels.forEach(ap => ap.off('mouseover mouseout click'))
      }).bringToFront();
  }

  const initEdit = layer => {
    // Move map view on top of selected polygon.
    Map.fitBounds(layer.getBounds());

    // Activate edit handler on selected polygon
    edit.polygon.enable(layer, config);
    setState({ layer: layer, data: layer.feature.properties, isGuided: false, showForm: true });

    // Activate edit event listeners on layer.
    layer.on('pm:edit', e => setState({ layer: e.target }));
  }

  const _simplifyMultipolygon = layer => {
    let latlngArr = layer._latlngs
    let simpleLatlngArr = latlngArr[0];
    latlngArr.length = 0

    Object.keys(simpleLatlngArr).forEach(key =>
      latlngArr.push(simpleLatlngArr[key]));

    return layer;
  }

  const onChange = ({ formData }) => {
    setState({ data: { ...data, ...formData } });
  }

  const onSubmit = ({ formData }) => {
    saveAP(JSON.stringify({
      ...data,
      ...formData,
      OBJECT_ID: Number(layer.feature.id),
      parent_id: farmObjId,
      GEOM: factory.GeoJSON.fromLayer(layer)
    }), disable);
  }

  const renderGuideForm = () => {
    return <GuideForm id={_id} disable={() => disable()} msg={editAPMsg} title='Промени земјоделска парцела' />
  }

  const renderForm = () => {
    return (
      <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
        <DrawActions cancel={() => disable()} />
      </Form>
    )
  }

  const renderComponent = () => {
    let componentToRender = null

    if (isGuided && !showForm) {
      componentToRender = renderGuideForm()
    } else if (showForm && !isGuided) {
      componentToRender = renderForm()
    }

    return componentToRender
  }

  return <ProcessButton id={_id} onClick={enable} >
    <Icon name={_id} size='30px' />
    <span style={{ display: 'block', marginTop: '5px' }}>Промени парцела</span>
    {processID === _id && renderComponent()}
    {loading && <Loading />}
  </ProcessButton>;
}

export const Edit = core.connect(state => ({
  processID: state.app.processID, mapId: state.map.id, farmObjId: state.farmRegistry?.farmObjId, agriParcels: state.farmRegistry?.agriParcels
}))(_Edit)
