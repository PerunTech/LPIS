import { React, Loading, elements } from 'perun-core';
import { core, ui, data, tools } from '../../../Spatial';
import { ProcessButton } from '../ProcessButton';
import { Guidance } from '../agriParcel/Guidance';
import { config, loadPhysicalBlockMsg, setLoadedPhysicalBlockLabel } from './Config';
import { strcmp } from '../../Util';

const { Map, store, connect, http, factory } = core;
const { geobuf, protobuf } = data;
const { Icon } = ui;
const { alertUser } = elements;
const { useEffect, useReducer } = React;

const _id = 'load';
const _secondaryId = 'removeLoadedPhysicalBlocks';
const _iconId = 'copy';
const _secondaryIconId = 'erase';
const _layerGroup = factory.layerGroup();

export function getPhysicalBlockInfo (p, callback, setState) {
  const url = `/lpis/geometry/get/point/{init.token}/PHYSICAL_BLOCK/${p.x}/${p.y}`
  http.call('get-parcel-info', { url, responseType: 'arraybuffer' }).then(response => {
    if (setState) {
      setState({ loading: false })
    }
    const data = geobuf.decode(protobuf(response));
    const geojson = factory.geoJSON(data, config.pathOptions);
    const layers = geojson.getLayers();
    if (layers && Array.isArray(layers) && layers.length > 0) {
      const loadedPhysicalBlocks = store.getState().lpis?.loadedPhysicalBlocks
      layers.forEach(layer => {
        Reflect.set(loadedPhysicalBlocks, layer.feature.properties?.OLD_ID, layer)
        layer.feature.point = p
        if (layer?.feature?.properties) {
          layer.feature.properties.DESCRIPTOR = 'PHYSICAL_BLOCK'
        }
        setLoadedPhysicalBlockLabel(layer)
        layer.addTo(Map)
      });
      store.dispatch({ physicalBlocksHaveBeenLoaded: true, loadedPhysicalBlocks })
      if (setState) {
        setState({ physicalBlocksHaveBeenLoaded: true })
      }
    } else {
      alertUser(true, 'info', 'Не е избран физички блок од мапата')
      if (callback) {
        callback()
      }
    }
  }).catch(err => {
    console.error(err)
    alertUser(true, 'error', 'Настана грешка')
    store.dispatch({ processID: '', physicalBlocksHaveBeenLoaded: false })
    if (callback) {
      callback()
    }
    if (setState) {
      setState({ loading: false, isGuided: false, physicalBlocksHaveBeenLoaded: false })
    }
  })
}

const _Load = ({ processID, physicalBlocksHaveBeenLoaded: physicalBlocksHaveBeenLoadedStore }) => {
  const [{ loading, isGuided, physicalBlocksHaveBeenLoaded }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { loading: false, isGuided: false, physicalBlocksHaveBeenLoaded: false });

  useEffect(() => {
    return () => {
      store.dispatch({ loadedPhysicalBlocks: {}, physicalBlocksHaveBeenLoaded: false })
    }
  }, [])

  useEffect(() => {
    if (!physicalBlocksHaveBeenLoadedStore) {
      setState({ physicalBlocksHaveBeenLoaded: false })
    }
  }, [physicalBlocksHaveBeenLoadedStore])

  const removeLoadedLayers = () => {
    if (!physicalBlocksHaveBeenLoaded && !physicalBlocksHaveBeenLoadedStore) {
      alertUser(true, 'info', 'Не се пронајдени вчитани физички блокови')
    } else {
      Map.eachLayer(function (layer) {
        if (!!layer.toGeoJSON) {
          if (layer?.feature?.properties?.DESCRIPTOR && strcmp(layer?.feature?.properties?.DESCRIPTOR, 'PHYSICAL_BLOCK')) {
            Map.removeLayer(layer);
          }
        }
      });

      _layerGroup.clearLayers().removeFrom(Map);
      setState({ physicalBlocksHaveBeenLoaded: false })
      store.dispatch({ loadedPhysicalBlocks: {}, physicalBlocksHaveBeenLoaded: false })
    }
  }

  const enable = () => {
    store.dispatch({ processID: _id });
    setState({ isGuided: true });

    _layerGroup.addTo(Map);

    Map.on('click', e => {
      const p = Map.transform(e.latlng);
      setState({ loading: true });
      getPhysicalBlockInfo(p, disable, setState)
    })
  }

  const disable = () => {
    // Remove the Map click event listener
    Map.off('click');
    // Reset state, internal and application-wide.
    setState({ loading: false, isGuided: false });
    store.dispatch({ processID: '' });
  };

  const renderGuideForm = () => {
    return <Guidance id={_id} disable={disable} msg={loadPhysicalBlockMsg} title='Вчитај физички блок' />
  }

  const renderComponent = () => {
    let componentToRender = null

    if (isGuided) {
      componentToRender = renderGuideForm()
    }

    return componentToRender
  }

  return (
    <React.Fragment>
      <ProcessButton id={_id} onClick={enable}>
        <Icon name={_iconId} size='30px' />
        <span style={{ display: "block", marginTop: '5px' }}>Вчитај</span>
        {processID === _id && renderComponent()}
        {loading && <Loading />}
      </ProcessButton>
      <ProcessButton id={_secondaryId} onClick={removeLoadedLayers}>
        <Icon name={_secondaryIconId} size='30px' />
        <span style={{ display: "block", marginTop: '5px' }}>Отстрани</span>
      </ProcessButton>
    </React.Fragment>
  );
}

export const Load = connect((state) => ({
  processID: state.app.processID,
  physicalBlocksHaveBeenLoaded: state.lpis?.physicalBlocksHaveBeenLoaded,
  loadedPhysicalBlocks: state.lpis?.loadedPhysicalBlocks,
}))(_Load);
