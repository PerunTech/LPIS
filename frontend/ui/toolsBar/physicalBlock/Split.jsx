import { React, Loading, elements } from 'perun-core';
import { core, ui, data, tools } from '../../../Spatial';
import { config } from './Config';
import { Guidance } from '../agriParcel/Guidance';
import { ProcessButton } from '../ProcessButton';
import { getPhysicalBlockInfo } from './Load';
import { decodeResponse, getLabel, strcmp } from '../../Util';

const { Map, store, factory, http } = core;
const { geobuf, protobuf } = data;
const { draw: { line }, markerPoints } = tools;
const { Icon } = ui;
const { useReducer, useEffect } = React;
const { alertUser } = elements;

const _id = 'split-pb';

const _Split = ({ processID, loadedPhysicalBlocks }) => {
  const [{ loading, selectedLayer }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }), { loading: false, selectedLayer: {} });

  useEffect(() => {
    return () => {
      line.disable('force');
      Map.off('new_shape');
      Map.eachLayer(layer => {
        if (layer?.options?.icon) {
          layer.removeFrom(Map)
        }
      })
    }
  }, [])

  const initAction = (layer, layers) => {
    setState({ selectedLayer: layer })
    Object.values(layers).forEach(layer => {
      layer.setStyle({ fillColor: '#f8f8ff' })
      layer.off('mouseover mouseout click')
    })
    markerPoints.enable(layer, config);
    _handleLayerClick(layer)
  }

  const _setBlockEvents = layers => {
    Object.values(layers).forEach(layer => {
      layer.on('mouseover', function () { this.setStyle({ fillColor: '#000000' }) })
        .on('mouseout', function () { this.setStyle({ fillColor: '#f8f8ff' }) })
        .on('click', function () {
          initAction(this, layers);
        })
    })
  }

  const cleanup = (lineLayer) => {
    store.dispatch({ processID: '' })
    disable()
    Map.off('new_shape');
    //remove line
    if (lineLayer) {
      lineLayer.removeFrom(Map);
    }
    Map.eachLayer(function (layer) {
      if (!!layer.toGeoJSON) {
        if (layer?.options?.name && strcmp(layer.options.name, 'marker-point')) {
          Map.removeLayer(layer);
        }
      }
    })
  }

  const _enableLine = (point, selectedLayer) => {
    Map.on('new_shape', e => {
      if (e && e.layer) {
        const title = 'Дали сакате да го поделите физичкиот блок?'
        alertUser(true, 'warning', title, '', () => splitPB(e.layer, point, selectedLayer), () => cleanup(e.layer), true, 'Да', 'Не')
      } else {
        cleanup(e.layer);
      }
    });
    line.enable(config);
  }

  const _handleLayerClick = (pb) => {
    pb.on('click', function (e) {
      const latLng = e.latlng
      // Get the correct coordinates for the current CRS
      const point = Map.transform(latLng);
      pb.off('click')
      // Create a marker & add it to the map
      const markerConfig = { icon: factory.divIcon({ className: 'marker-icon' }) }
      const marker = factory.marker(latLng, markerConfig)
      marker.addTo(Map)
      _enableLine(point, pb);
    });
  }

  const enable = () => {
    if (!Object.keys(loadedPhysicalBlocks).length > 0) {
      alertUser(true, 'info', getLabel('no_loaded_physical_blocks'), getLabel('load_physical_blocks_before_using_split_tool'))
      disable()
    } else {
      _setBlockEvents(loadedPhysicalBlocks)
      store.dispatch({ processID: _id })
    }
  };

  const splitPB = (lineLayer, point, selectedLayer) => {
    setState({ loading: true })
    const selectedLayerId = selectedLayer.feature.id
    const { x, y } = point
    http.call(_id, {
      url: `/lpis/split/agriParcel/{init.token}/PHYSICAL_BLOCK/0/${x}/${y}`,
      method: 'post',
      responseType: 'arraybuffer',
      data: JSON.stringify({
        OBJECT_ID: selectedLayerId,
        GEOM: factory.GeoJSON.fromLayer(lineLayer)
      })
    }).then(response => {
      setState({ loading: false })
      const geojson = factory.geoJSON(geobuf.decode(protobuf(response)), config.pathOptions);
      geojson.getLayers().forEach(layer => {
        Object.values(loadedPhysicalBlocks).forEach(loadedLayer => {
          if (loadedLayer.feature.id === layer.feature.id) {
            // Remove the loaded layer from the map & from the loadedPhysicalBlocks object
            loadedLayer.removeFrom(Map)
            Reflect.deleteProperty(loadedPhysicalBlocks, loadedLayer.feature.id)
            // Get the layer once again, using the point as the WS param
            getPhysicalBlockInfo(point)
          }
        })
      })
      const numOfPhysicalBlocks = geojson.getLayers().length
      const msg = numOfPhysicalBlocks === 1 ? 'Добиен е еден нов физички блок.' : `Добиени се ${numOfPhysicalBlocks} нови физички блокови.`
      alertUser(true, 'success', 'Успешно поделен физички блок', msg)
      cleanup(lineLayer);
    }).catch(error => {
      setState({ loading: false })
      const { response } = error
      const errorMsg = decodeResponse(response, 'physical_block')
      alertUser(true, 'error', 'Грешка при поделба на физички блок', errorMsg)
      cleanup(lineLayer);
    })
  }

  const disable = () => {
    // Reset state
    store.dispatch({ processID: '' });
    // This will remove the point when disabling the action
    Map.eachLayer(layer => {
      if (layer?.options?.icon) {
        layer.removeFrom(Map)
      }
    })
    // Disable Split handler.
    line.disable('force');
  }

  const renderGuideForm = () => {
    let msg = ['Изберете физички блок кој ќе биде предмет на поделба', '']
    if (Object.keys(selectedLayer).length > 0) {
      msg = ['Алатката за поделба на физички блок е активна', '']
    }
    return (
      <Guidance id={_id} msg={msg} title={getLabel('split_physical_block')}
        finish={() => line._finishShape()}
        undo={() => line._removeLastVertex()}
        disable={disable}
      />
    )
  }

  return (
    <ProcessButton id={_id} onClick={enable} title={getLabel('split_physical_block')}>
      <Icon name={_id} size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('split_physical_block')}</span>
      {processID === _id && renderGuideForm()}
      {loading && <Loading />}
    </ProcessButton>
  );
};

export const Split = core.connect(state => ({
  processID: state.app.processID,
  loadedPhysicalBlocks: state.lpis?.loadedPhysicalBlocks,
}))(_Split)
