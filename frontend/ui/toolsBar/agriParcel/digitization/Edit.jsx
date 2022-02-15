import { React, Loading, redux } from 'perun-core';
import { core, ui, config as cfg } from '../../../../Spatial';
import { getFarmMapAssets } from '../../../Util';
import { ProcessButton } from '../../ProcessButton';
import { Guidance } from './Guidance';
import { Form } from '../Form';
import { saveAP } from '../Save';

const { MIN_DIGI_SCALE, MAP_CONFIG } = cfg;
const { Map, store, factory } = core;
const { edit } = tools;
const { Icon, DrawActions } = ui;
const { useReducer } = React;

const _layerGroup = factory.layerGroup();
const _id = 'editAP';

const _Edit = ({ processID, mapId, farmObjId }) => {
  const [{ layer, data, X, Y, loading, isGuided }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { layer: {}, data: {}, X: 0, Y: 0, loading: false, isGuided: false });

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
  (isGuided
    ? <Guidance id={_id} disable={() => disable(_stopEditAP)} msg={createAPMsg} title='Промени земјоделска парцела' />
    : <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
      <DrawActions cancel={() => disable(_stopEditAP)} />
    </Form>)


  return <ProcessButton id={_id} onClick={_editAP} >
    <Icon name={_id} size='30px' />
    <span style={{ display: 'block', marginTop: '5px' }}>Промени парцела</span>
    {processID === _id
      && renderForm()}
    {loading && <Loading />}
  </ProcessButton>;
};

export const Edit = core.connect(state => ({
  processID: state.app.processID, mapId: state.map.id, farmObjId: state.farmRegistry?.farmObjId
}))(_Edit)
