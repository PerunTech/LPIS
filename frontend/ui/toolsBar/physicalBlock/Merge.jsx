import { React, Loading, elements } from 'perun-core';
import { core, ui, data, tools } from '../../../Spatial';
import geomsIntersect from '@turf/boolean-intersects';
import { config } from './Config';
import { decodeResponse, getLabel } from '../../Util';
import { Guidance } from '../agriParcel/Guidance';
import { ProcessButton } from '../ProcessButton';
import { getPhysicalBlockInfo } from './Load';

const { Map, store, factory, http } = core;
const { geobuf, protobuf } = data;
const { draw: { line } } = tools;
const { Icon } = ui;
const { useReducer, useEffect } = React;
const { alertUser } = elements;

const _id = 'merge-pb';

const _Merge = ({ processID, loadedPhysicalBlocks }) => {
  const [{ layer, loading }, setState] = useReducer((currState, update) => ({ ...currState, ...update }), { layer: {}, loading: false });

  useEffect(() => {
    return () => {
      line.disable('force');
      Map.off('new_shape');
    }
  }, [])

  const cleanup = (lineLayer, getNewLayer, point) => {
    disable(lineLayer, getNewLayer, point)
    Map.off('new_shape');
    //remove line
    if (lineLayer) {
      lineLayer.removeFrom(Map);
    }
  }

  const enable = () => {
    if (!Object.keys(loadedPhysicalBlocks).length > 0) {
      alertUser(true, 'info', getLabel('no_loaded_physical_blocks'), getLabel('load_physical_blocks_before_using_merge_tool'))
      disable()
    } else {
      Map.on('new_shape', e => {
        if (e && e.layer) {
          const title = `${getLabel('merging_physical_blocks')}`
          const msg = `${getLabel('merging_physical_blocks_confirmation')}`
          alertUser(true, 'warning', title, msg, () => mergePB(e.layer), () => cleanup(e.layer), true, `${getLabel('yes')}`, `${getLabel('no')}`)
        } else {
          cleanup();
        }
      });
      store.dispatch({ processID: _id });
      line.enable(config);
    }
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
      let point = {}
      geojson.getLayers().forEach(layer => {
        point = Map.transform(layer.getBounds().getCenter());
      })
      const msg = numOfNewPhysicalBlocks === 1 ? `${getLabel('merge_physical_block_msg_one')}` : `${getLabel('merge_physical_block_msg_two')} ${numOfNewPhysicalBlocks} ${getLabel('merge_physical_block_msg_three')}.`
      alertUser(true, 'success', `${getLabel('merge_physical_block_success')}`, msg)
      cleanup(lineLayer, true, point);
    }).catch(error => {
      console.error(error)
      setState({ loading: false })
      const { response } = error
      const errorMsg = decodeResponse(response, 'physical_block')
      alertUser(true, 'error', `${getLabel('merge_physical_block_error')}`, errorMsg);
      cleanup(lineLayer);
    })
  }

  const disable = (lineLayer, getNewLayer, point) => {
    if (lineLayer && getNewLayer) {
      Object.values(loadedPhysicalBlocks).forEach(loadedLayer => {
        const lineGeoJSON = lineLayer.toGeoJSON()
        const polygonGeoJSON = loadedLayer.toGeoJSON()
        // Check if the line intersects with any of the loaded polygons
        if (geomsIntersect(lineGeoJSON, polygonGeoJSON)) {
          // Remove the loaded layer from the map & from the loadedPhysicalBlocks object
          loadedLayer.removeFrom(Map)
          Reflect.deleteProperty(loadedPhysicalBlocks, loadedLayer.feature.id)
        }
      })
      // Get the layer once again, using the point as the WS param
      getPhysicalBlockInfo(point)
    }
    // Reset state, internal and application-wide.
    setState({ layer: {} });
    store.dispatch({ processID: '' });
    // We remove the working geometry.
    layer.removeFrom && layer.removeFrom(Map);
    // Disable Split handler.
    line.disable('force');
  }

  return (
    <ProcessButton id={_id} onClick={enable} title={getLabel('merge_physical_block')}>
      <Icon name={_id} size='30px' style={{ marginTop: '2px' }} />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('merge_physical_block')}</span>
      {loading && <Loading />}
      {processID === _id
        && <Guidance id={_id}
          finish={() => line._finishShape()}
          undo={() => line._removeLastVertex()}
          disable={disable}
          msg={[`${getLabel('merge_physical_block_msg')}`, '']}
          title={getLabel('merge_physical_block')} />}
    </ProcessButton>
  );
};

export const Merge = core.connect(state => ({
  processID: state.app.processID,
  loadedPhysicalBlocks: state.lpis?.loadedPhysicalBlocks,
}))(_Merge)
