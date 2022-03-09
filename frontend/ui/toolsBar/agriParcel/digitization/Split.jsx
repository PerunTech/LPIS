import { React, elements } from 'perun-core';
import { core, ui, data, tools } from '../../../../Spatial';
import { config, splitAPMsg } from '../Config';
import { decodeResponse, getFarmMapAssets } from '../../../Util';
import { Guidance } from '../Guidance';
import { ProcessButton } from '../../ProcessButton';

const { Map, store, factory, http } = core;
const { geobuf, protobuf } = data;
const { draw: { line } } = tools;
const { Icon } = ui;
const { alertUser } = elements;
const _id = 'splitAP';

const _Split = ({ processID, agriParcels, farmObjId }) => {
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
        const title = 'Дали сакате да ја поделите парцелата?'
        alertUser(true, 'warning', title, '', splitParcel.bind(null, e.layer, point), cleanup.bind(null, e.layer), true, 'Да', 'Не')
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
    if (agriParcels.length > 0) {
      agriParcels.forEach(ap => _handleLayerClick(ap, agriParcels))
      store.dispatch({ processID: _id });
    } else {
      alertUser(true,
        'warning',
        'Не се пронајдени земјоделски парцели.',
        'Додадете земјоделски парцели пред да ја користите алатката за делење.',
        () => disable());
    }
  };

  const splitParcel = (lineLayer, point) => {
    const { x, y } = point
    http.call(_id, {
      url: `/lpis/split/agriParcel/{init.token}/AGRI_PARCEL/${farmObjId}/${x}/${y}`,
      method: 'post',
      responseType: 'arraybuffer',
      data: JSON.stringify(factory.GeoJSON.fromLayer(lineLayer))
    }).then(response => {
      const geojson = factory.geoJSON(geobuf.decode(protobuf(response)), config.pathOptions);
      const stateData = store.getState().data.layers;

      geojson.getLayers().forEach(layer => {
        const id = layer.feature.id
        // remove old app layers entries, will update with the new geojson set.
        stateData[id] && stateData[id].removeFrom(Map);
      })
      alertUser(true, 'success', 'Успешно поделена земјоделска парцела', 'Добиени се ' + geojson.getLayers().length + ' нови парцели.', getFarmMapAssets)
    }).catch(error => {
      const { response } = error
      const errorMsg = decodeResponse(response)
      alertUser(true, 'error', 'Грешка при поделба земјоделска парцела', errorMsg, getFarmMapAssets);
    })

    //remove line   
    cleanup(lineLayer);
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
    return <Guidance id={_id} msg={splitAPMsg} title='Подели парцела'
      finish={() => line._finishShape()}
      undo={() => line._removeLastVertex()}
      disable={disable}
    />
  }

  return <ProcessButton id={_id} onClick={enable} title='Подели парцела' className='mr-2' >
    <Icon name={_id} size='28px' style={{ marginTop: '2px' }} />
    <span style={{ display: 'block', marginTop: '5px' }}>Подели</span>
    {processID === _id && renderGuideForm()}
  </ProcessButton>;
};

export const Split = core.connect(state => ({
  processID: state.app.processID, agriParcels: state.farmRegistry?.agriParcels, farmObjId: state.farmRegistry?.farmObjId
}))(_Split)
