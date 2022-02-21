import { React, Loading, elements } from 'perun-core';
import { core, ui, data, tools, config as cfg } from '../../../../Spatial';
import { config, editAPMsg } from '../Config';
import { getFarmMapAssets } from '../../../Util';
import { saveAP } from '../SaveAP';
import { GuideForm } from '../GuideForm';
import { Form } from '../Form';
import { ProcessButton } from '../../ProcessButton';

const { MIN_DIGI_SCALE, MAP_CONFIG } = cfg;
const { Map, store, factory, http } = core;
const { geobuf, protobuf } = data;
const { edit } = tools;
const { Icon, DrawActions } = ui;
const { useReducer } = React;

const _id = 'editAP';
const _layerGroup = factory.layerGroup();
const _style = { color: '#eed000', fillColor: '#FFFFFF' };

const _Edit = ({ processID, farmObjId, agriParcels }) => {
  const [{ layer, data, loading, isGuided }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }), { layer: {}, data: {}, loading: false, isGuided: false });

  const enable = (id) => {
    store.dispatch({ processID: id, minZoom: MIN_DIGI_SCALE });
    if (agriParcels.length > 0) {
        agriParcels.forEach(sc => _setBlockEvents(sc, agriParcels))
        _editAP()
        store.dispatch({ processID: _id })
        setState({ isGuided: true })
    } else {
        disable();
        elements.alertUser(true,
            'warning',
            'Не се пронајдени земјоделски парцели.',
            'Додадете земјоделски парцели пред да ја користите алатката за менување.');
    }
  };

  const disable = () => {
    Map.off('click');
    // Reset state, internal and application-wide.
    setState({ layer: {}, data: {}, isGuided: false, loading: false });
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

  const _setBlockEvents = layer => {
    layer.on('mouseover', function () { this.setStyle({ color: '#eed000', fillColor: '#000000' }) })
      .on('mouseout', function () { this.setStyle(_style) })
      .on('click', function () { initEdit(layer); })
  }

  const initEdit = layer => {
    layer.setStyle(_style)
    // disable all selection events on group. Remove edited layer from group.
    _layerGroup.eachLayer(el => el.off('mouseover mouseout click'));
    _layerGroup.removeLayer(layer);
    // re-add layer as standalone.
    layer.options.metadata = config.pathOptions.metadata;
    layer.addTo(Map);

    // Move map view on top of selected polygon.
    Map.fitBounds(layer.getBounds());

    // Activate edit handler on selected polygon
    edit.polygon.enable(_simplifyMultipolygon(layer), config);
    setState({ layer: layer, data: layer.feature.properties, isGuided: false });

    // Activate edit event listeners on layer.
    layer.on('pm:edit', e => setState({ layer: e.target, data: e.target.feature.properties }));
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

  return <ProcessButton id={_id} onClick={() => enable(_id)} >
    <Icon name={_id} size='30px' />
    <span style={{ display: 'block', marginTop: '5px' }}>Промени парцела</span>
    {processID === _id
      && (isGuided
        ? <GuideForm id={_id} disable={() => disable()} msg={editAPMsg} title='Промени земјоделска парцела' />
        : <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
          <DrawActions cancel={() => disable()} />
        </Form>)}
    {loading && <Loading />}
  </ProcessButton>;
}

export const Edit = core.connect(state => ({
  processID: state.app.processID, mapId: state.map.id, farmObjId: state.farmRegistry?.farmObjId, agriParcels: state.farmRegistry?.agriParcels
}))(_Edit)
