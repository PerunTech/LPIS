import { React, Loading, redux } from 'perun-core';
import { core, ui, data } from '../../../../Spatial';
import { getFarmMapAssets } from '../../../Util';
import { ProcessButton } from '../../ProcessButton';
import { config } from '../Config';
import { Form } from '../Form';
import { saveAP } from '../Save';

const { Map, store, factory, http } = core;
const { draw: { line } } = tools;
const { geobuf, protobuf } = data;
const { Icon, DrawActions } = ui;
const { useReducer } = React;
const _id = 'splitAP';

const _Split = ({ processID, mapId, farmObjId }) => {
  const [{ layer, data, X, Y, loading }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { layer: {}, data: {}, X: 0, Y: 0, loading: false });

  const enable = (id, fn) => {
    store.dispatch({ processID: id, minZoom: MIN_DIGI_SCALE });
    setState({ isGuided: true })
    fn && fn();
  };

  const _splitAP = () => {
    Map.on('new_shape', e => {
      if (e && e.layer) {
        http.call(_id, { data: JSON.stringify(factory.GeoJSON.fromLayer(e.layer)) })
          .then(response => {
            const geojson = factory.geoJSON(geobuf.decode(protobuf(response)), config.pathOptions);
            const stateData = store.getState().data.layers;

            geojson.getLayers().forEach(layer => {
              const id = layer.feature.id

              // remove old app layers entries, will update with the new geojson set.
              stateData[id] && stateData[id].removeFrom(Map);

              layer.addTo(Map);
              e.layer.removeFrom(Map);
            })

            elements.alertUser(true,
              'success',
              'Успешно поделена земјоделска парцела',
              'Добиени се ' + geojson.getLayers().length + ' нови парцели.')
          })
          .catch(error => console.log(error))
      }

      disable()
      Map.off('new_shape');
    });

    line.enable(config);
  }

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
      OBJECT_ID: 0
    }, disable);

  const renderForm = () =>
    <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
      <DrawActions
        finish={() => line._finishShape()}
        undo={() => line._removeLastVertex()}
        cancel={() => disable(_stopLineAP)} />
    </Form>


  return <ProcessButton id={_id} onClick={() => enable(_id, _splitAP)} >
    <Icon name={_id} size='30px' />
    <span style={{ display: 'block', marginTop: '5px' }}>Промени парцела</span>
    {processID === _id
      && renderForm()}
    {loading && <Loading />}
  </ProcessButton>;
};

export const Split = core.connect(state => ({
  processID: state.app.processID, mapId: state.map.id, farmObjId: state.farmRegistry?.farmObjId
}))(_Split)
