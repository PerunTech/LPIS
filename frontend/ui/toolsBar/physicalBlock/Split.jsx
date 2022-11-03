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

const _id = 'split-pb';

const _Split = ({ processID }) => {
  const [{ loading }, setState] = useReducer((currState, update) => ({ ...currState, ...update }), { loading: false });

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

  const cleanup = (lineLayer) => {
    disable()
    Map.off('new_shape');
    //remove line
    if (lineLayer) {
      lineLayer.removeFrom(Map);
    }
  }

  const _enableLine = point => {
    Map.on('new_shape', e => {
      if (e && e.layer) {
        const title = 'Дали сакате да го поделите физичкиот блок?'
        alertUser(true, 'warning', title, '', splitPB.bind(null, e.layer, point), cleanup.bind(null, e.layer), true, 'Да', 'Не')
      } else {
        cleanup();
      }
    });
    line.enable(config);
  }

  const _handleLayerClick = (ap, agriParcels) => {
    ap.on('click', function (e) {
      const latLng = e.latlng
      // Get the correct coordinates for the current CRS
      const point = Map.transform(latLng);
      agriParcels.forEach(ap => ap.off('click'))
      // Create a marker & add it to the map
      const markerConfig = { icon: factory.divIcon({ className: 'marker-icon' }) }
      const marker = factory.marker(latLng, markerConfig)
      marker.addTo(Map)
      _enableLine(point);
    });
  }

  const enable = () => {
    alertUser(
      true,
      'warning',
      'Не се пронајдени физички блокови.',
      'Додадете физички блокови пред да ја користите алатката за делење.',
    );
    disable()
  };

  const splitPB = (lineLayer, point) => {
    setState({ loading: true })
    const { x, y } = point
    http.call(_id, {
      url: `/lpis/split/physicalBlock/{init.token}/PHYSICAL_BLOCK/0/${x}/${y}`,
      method: 'post',
      responseType: 'arraybuffer',
      data: JSON.stringify(factory.GeoJSON.fromLayer(lineLayer))
    }).then(response => {
      setState({ loading: false })
      const geojson = factory.geoJSON(geobuf.decode(protobuf(response)), config.pathOptions);
      const numOfPhysicalBlocks = geojson.getLayers().length
      const msg = numOfPhysicalBlocks === 1 ? 'Добиена е еден нов физички блок.' : `Добиени се ${numOfPhysicalBlocks} нови физички блокови.`
      alertUser(true, 'success', 'Успешно поделен физички блок', msg)
      cleanup(lineLayer);
    }).catch(error => {
      setState({ loading: false })
      const { response } = error
      const errorMsg = decodeResponse(response, true)
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
    // Reload the assets
    getFarmMapAssets()
  }

  const renderGuideForm = () => {
    return (
      <Guidance id={_id} msg={['Алатката за поделба на физички блок е активна', '']} title='Подели блок'
        finish={() => line._finishShape()}
        undo={() => line._removeLastVertex()}
        disable={disable}
      />
    )
  }

  return (
    <ProcessButton id={_id} onClick={enable} title='Подели блок'>
      <Icon name={_id} size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>Подели блок</span>
      {processID === _id && renderGuideForm()}
      {loading && <Loading />}
    </ProcessButton>
  );
};

export const Split = core.connect(state => ({
  processID: state.app.processID
}))(_Split)
