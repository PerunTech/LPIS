import { React, Loading, elements } from 'perun-core';
import { core, ui, data, tools } from '../../../../Spatial';
import { config } from '../Config';
import { decodeResponse, getFarmMapAssets, getLabel } from '../../../Util';
import { Guidance } from '../Guidance';
import { ProcessButton } from '../../ProcessButton';

const { Map, store, factory, http } = core;
const { geobuf, protobuf } = data;
const { draw: { line } } = tools;
const { Icon } = ui;
const { useReducer, useEffect } = React;
const { alertUser } = elements;
const _id = 'splitAP';

const _Split = ({ processID, agriParcels, farmObjId }) => {
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
        const title = `${getLabel('split_agricultural_parcel_confirmation')}`
        alertUser(true, 'warning', title, '', splitParcel.bind(null, e.layer, point), cleanup.bind(null, e.layer), true, `${getLabel('yes')}`, `${getLabel('no')}`)
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
      alertUser(
        true,
        'warning',
        `${getLabel('no_parcels_found')}`,
        `${getLabel('add_parcels_before_using_split_tool')}`,
      );
      disable()
    }
  };

  const splitParcel = (lineLayer, point) => {
    setState({ loading: true })
    const { x, y } = point
    http.call(_id, {
      url: `/lpis/split/agriParcel/{init.token}/AGRI_PARCEL/${farmObjId}/${x}/${y}`,
      method: 'post',
      responseType: 'arraybuffer',
      data: JSON.stringify(factory.GeoJSON.fromLayer(lineLayer))
    }).then(response => {
      setState({ loading: false })
      const geojson = factory.geoJSON(geobuf.decode(protobuf(response)), config.pathOptions);
      const numOfNewParcels = geojson.getLayers().length
      const msg = numOfNewParcels === 1 ? `${getLabel('split_agricultural_parcel_msg_one')}` : `${getLabel('split_agricultural_parcel_msg_two')} ${numOfNewParcels} ${getLabel('split_agricultural_parcel_msg_three')}`
      alertUser(true, 'success', `${getLabel('split_agricultural_parcel_success')}`, msg)
      cleanup(lineLayer);
    }).catch(error => {
      setState({ loading: false })
      const { response } = error
      const errorMsg = decodeResponse(response)
      alertUser(true, 'error', `${getLabel('split_agricultural_parcel_error')}`, errorMsg)
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
    return <Guidance id={_id} msg={['', '']} title={getLabel('split_parcel')}
      finish={() => line._finishShape()}
      undo={() => line._removeLastVertex()}
      disable={disable}
    />
  }

  return <ProcessButton id={_id} onClick={enable} title={getLabel('split_parcel')} className='mr-2' >
    <Icon name={_id} size='28px' style={{ marginTop: '2px' }} />
    <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('split')}</span>
    {processID === _id && renderGuideForm()}
    {loading && <Loading />}
  </ProcessButton>;
};

export const Split = core.connect(state => ({
  processID: state.app.processID, agriParcels: state.farmRegistry?.agriParcels, farmObjId: state.farmRegistry?.farmObjId
}))(_Split)
