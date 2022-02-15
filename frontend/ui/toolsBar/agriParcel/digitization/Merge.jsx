import { React, Loading, redux } from 'perun-core';
import { core, ui, data, config as cfg } from '../../../../Spatial';
import { getFarmMapAssets } from '../../../Util';
import { ProcessButton } from '../../ProcessButton';
import { config } from '../Config';
import { Form } from '../Form';
import { saveAP } from '../Save';

const { MIN_DIGI_SCALE, MAP_CONFIG } = cfg;
const { Map, store, factory, http } = core;
const { draw: { line } } = tools;
const { geobuf, protobuf } = data;
const { Icon, DrawActions } = ui;
const { useReducer } = React;
const _id = 'mergeAP';

const _Merge = ({ processID, mapId, farmObjId }) => {
  const [{ layer, data, X, Y, loading }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { layer: {}, data: {}, X: 0, Y: 0, loading: false });

  const enable = (id, fn) => {
    store.dispatch({ processID: id, minZoom: MIN_DIGI_SCALE });
    setState({ isGuided: true })
    fn && fn();
  };

  const disable = (fn) => {
    Map.off('click');
    // Reset state, internal and application-wide.
    setState({ layer: {}, data: {}, isGuided: false });
    store.dispatch({ processID: '', minZoom: MAP_CONFIG.minZoom });
    // We remove the working geometry, save process will add the result.
    layer.removeFrom && layer.removeFrom(Map);
    if (mapId === 'farm-registry-map') {
      const session = redux.store.getState().security.svSession
      getFarmMapAssets(session)
    }
    fn && fn();
  }

  const _mergeAP = () => {
    Map.on('new_shape', e => {
      if (e && e.layer) {
        http.call(_id, { data: JSON.stringify(factory.GeoJSON.fromLayer(e.layer)) })
          .then(response => {
            const geojson = factory.geoJSON(geobuf.decode(protobuf(response)), config.pathOptions);

            Map.eachLayer(function (layer) {
              if (layer.toGeoJSON) {
                Map.removeLayer(layer);
              }
            });

            geojson.getLayers().forEach(layer => {
              // Flatten the geometry array, so utilities can read the thing. god knows why this happens.
              layer.setLatLngs([...util.flattenDeep(layer.getLatLngs())])
              layer.addTo(Map);
              e.layer.removeFrom(Map);
            })

            elements.alertUser(true, 'success', 'Успешно приспоени земјоделски парцели')
          })
          .catch(error => console.log(error))
      }

      disable()
      Map.off('new_shape');
    });
    line.enable(config);
  }

  const _stopLineAP = () => line.disable('force');


  const disable = (fn) => {
    // Reset state, internal and application-wide.
    setState({ layer: {}, data: {}, isGuided: false });
    store.dispatch({ processID: '', minZoom: MAP_CONFIG.minZoom });
    // We remove the working geometry, save process will add the result.
    layer.removeFrom && layer.removeFrom(Map);
    if (mapId === 'farm-registry-map') {
      const session = redux.store.getState().security.svSession
      getFarmMapAssets(session)
    }
    fn && fn();
  }

  const onChange = ({ formData }) =>
    setState({ data: { ...data, ...formData } });

  const onSubmit = ({ formData }) =>
    saveAP({
      ...data,
      ...formData,
      GEOM: factory.GeoJSON.fromLayer(layer),
      X: X,
      Y: Y,
      parent_id: farmObjId,
      OBJECT_ID: (layer.feature && layer.feature.id && Number(layer.feature.id)) || 0
    }, disable);

  const renderForm = () =>
    <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
      <DrawActions
        finish={() => line._finishShape()}
        undo={() => line._removeLastVertex()}
        cancel={() => disable(_stopLineAP)} />
    </Form>


  return <ProcessButton id={_id} onClick={() => enable(_id, _mergeAP)} >
    <Icon name={_id} size='30px' />
    <span style={{ display: 'block', marginTop: '5px' }}>Приспои парцели</span>
    {processID === _id
      && renderForm()}
    {loading && <Loading />}
  </ProcessButton>;
};

export const Merge = core.connect(state => ({
  processID: state.app.processID, mapId: state.map.id, farmObjId: state.farmRegistry?.farmObjId
}))(_Merge)
