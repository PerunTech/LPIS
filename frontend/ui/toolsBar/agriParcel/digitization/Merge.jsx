import { React, Loading, elements } from 'perun-core';
import { core, ui, data, tools } from '../../../../Spatial';
import { config, mergeAPMsg } from '../Config';
import { decodeResponse, getFarmMapAssets } from '../../../Util';
import { Guidance } from '../Guidance';
import { ProcessButton } from '../../ProcessButton';

const { Map, store, factory, http } = core;
const { geobuf, protobuf } = data;
const { draw: { line } } = tools;
const { Icon } = ui;
const { useReducer, useEffect } = React;
const { alertUser } = elements;
const _id = 'mergeAP';

const _Merge = ({ processID, farmObjId }) => {
  const [{ layer, loading }, setState] = useReducer((currState, update) => ({ ...currState, ...update }), { layer: {}, loading: false });

  useEffect(() => {
    return () => {
      line.disable('force');
      Map.off('new_shape');
    }
  }, [])

  const cleanup = (lineLayer) => {
    disable()
    Map.off('new_shape');
    //remove line
    if (lineLayer) {
      lineLayer.removeFrom(Map);
    }
  }

  const enable = () => {
    Map.on('new_shape', e => {
      if (e && e.layer) {
        const title = 'Спојување на парцели'
        const msg = 'Дали сакате да ги споите избраните парцели во една парцела?'
        alertUser(true, 'warning', title, msg, mergeParcel.bind(null, e.layer), cleanup.bind(null, e.layer), true, 'Да', 'Не')
      } else {
        cleanup();
      }
    });
    store.dispatch({ processID: _id });
    line.enable(config);
  };

  const mergeParcel = (lineLayer) => {
    setState({ loading: true })
    http.call(_id, {
      url: '/lpis/geometry/merge/confirm/{init.token}/AGRI_PARCEL/' + farmObjId,
      method: 'post',
      responseType: 'arraybuffer',
      data: JSON.stringify(factory.GeoJSON.fromLayer(lineLayer))
    }).then(response => {
      setState({ loading: false })
      const geojson = factory.geoJSON(geobuf.decode(protobuf(response)), config.pathOptions);
      const numOfNewParcels = geojson.getLayers().length
      const msg = numOfNewParcels === 1 ? 'Добиена е една нова парцела.' : `Добиени се ${numOfNewParcels} нови парцели.`
      alertUser(true, 'success', 'Успешно споени парцели', msg)
      cleanup(lineLayer);
    }).catch(error => {
      setState({ loading: false })
      const { response } = error
      const errorMsg = decodeResponse(response)
      alertUser(true, 'error', 'Грешка при спојување на парцели', errorMsg);
      cleanup(lineLayer);
    })
  }

  const disable = () => {
    // Reset state, internal and application-wide.
    setState({ layer: {} });
    store.dispatch({ processID: '' });
    // We remove the working geometry, save process will add the result.
    layer.removeFrom && layer.removeFrom(Map);
    // Disable Split handler.
    line.disable('force');
    // Reload the assets
    getFarmMapAssets()
  }

  return <ProcessButton id={_id} onClick={enable} title='Спои парцела' className='mr-2' >
    <Icon name={_id} size='28px' style={{ marginTop: '2px' }} />
    <span style={{ display: 'block', marginTop: '5px' }}>Спои</span>
    {loading && <Loading />}
    {processID === _id
      && <Guidance id={_id}
        finish={() => line._finishShape()}
        undo={() => line._removeLastVertex()}
        disable={disable}
        msg={mergeAPMsg}
        title='Спои парцела' />}
  </ProcessButton>;
};

export const Merge = core.connect(state => ({
  processID: state.app.processID, mapId: state.map.id, farmObjId: state.farmRegistry?.farmObjId
}))(_Merge)
