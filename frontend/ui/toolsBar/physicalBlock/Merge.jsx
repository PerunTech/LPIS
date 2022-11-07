import { React, Loading, elements } from 'perun-core';
import { core, ui, data, tools } from '../../../Spatial';
import { config } from './Config';
import { decodeResponse } from '../../Util';
import { Guidance } from '../agriParcel/Guidance';
import { ProcessButton } from '../ProcessButton';

const { Map, store, factory, http } = core;
const { geobuf, protobuf } = data;
const { draw: { line } } = tools;
const { Icon } = ui;
const { useReducer, useEffect } = React;
const { alertUser } = elements;

const _id = 'merge-pb';

const _Merge = ({ processID }) => {
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
        const title = 'Спојување на физички блокови'
        const msg = 'Дали сакате да ги споите избраните физички блокови во еден?'
        alertUser(true, 'warning', title, msg, mergePB.bind(null, e.layer), cleanup.bind(null, e.layer), true, 'Да', 'Не')
      } else {
        cleanup();
      }
    });
    store.dispatch({ processID: _id });
    line.enable(config);
  };

  const mergePB = (lineLayer) => {
    setState({ loading: true })
    http.call(_id, {
      url: '/lpis/geometry/merge/confirm/{init.token}/PHYSICAL_BLOCK/' + 0,
      method: 'post',
      responseType: 'arraybuffer',
      data: JSON.stringify(factory.GeoJSON.fromLayer(lineLayer))
    }).then(response => {
      setState({ loading: false })
      const geojson = factory.geoJSON(geobuf.decode(protobuf(response)), config.pathOptions);
      const numOfNewPhysicalBlocks = geojson.getLayers().length
      const msg = numOfNewPhysicalBlocks === 1 ? 'Добиен е еден нов физички блок.' : `Добиени се ${numOfNewPhysicalBlocks} нови физички блок.`
      alertUser(true, 'success', 'Успешно споени физички блок', msg)
      cleanup(lineLayer);
    }).catch(error => {
      setState({ loading: false })
      const { response } = error
      const errorMsg = decodeResponse(response, 'physical_block')
      alertUser(true, 'error', 'Грешка при спојување на физички блок', errorMsg);
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
  }

  return (
    <ProcessButton id={_id} onClick={enable} title='Спои блок'>
      <Icon name={_id} size='30px' style={{ marginTop: '2px' }} />
      <span style={{ display: 'block', marginTop: '5px' }}>Спои блок</span>
      {loading && <Loading />}
      {processID === _id
        && <Guidance id={_id}
          finish={() => line._finishShape()}
          undo={() => line._removeLastVertex()}
          disable={disable}
          msg={['Алатката за спојување физички блокови е активна', '']}
          title='Спои блок' />}
    </ProcessButton>
  );
};

export const Merge = core.connect(state => ({
  processID: state.app.processID
}))(_Merge)
