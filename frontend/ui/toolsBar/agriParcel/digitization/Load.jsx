import { React, Loading, elements } from 'perun-core';
import { core, ui, data } from '../../../../Spatial';
import { config as apConfig, loadParcelMsg } from '../Config';
import { ProcessButton } from '../../ProcessButton';
import { Guidance } from '../Guidance';
import { setLoadedParcelLabel } from '../../cropParcel/Util';
import { strcmp } from '../../../Util';

const { Map, store, http, factory } = core;
const { geobuf, protobuf } = data;
const { Icon } = ui;
const { alertUser } = elements;
const { useEffect, useReducer } = React;

const _id = 'load';
const _secondaryId = 'removeLoadedParcels';
const _iconId = 'copy';
const _secondaryIconId = 'erase';

const _Load = ({ processID, agriParcels, parcelsHaveBeenLoaded: parcelsHaveBeenLoadedStore }) => {
  const [{ loading, isGuided, parcelsHaveBeenLoaded }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { loading: false, isGuided: false, parcelsHaveBeenLoaded: false });

  useEffect(() => {
    return () => {
      store.dispatch({ parcelsHaveBeenLoaded: false })
    }
  }, [])

  const setLayerEvents = (layer, agriParcels) => {
    layer.on('click', function () {
      setState({ data: layer.feature.properties })
      agriParcels.forEach(ap => ap.off('mouseover mouseout click'))
    })
  }

  const removeLoadedLayers = () => {
    if (!parcelsHaveBeenLoaded && !parcelsHaveBeenLoadedStore) {
      alertUser(true, 'info', 'Не се пронајдени вчитани парцели')
    } else {
      Map.eachLayer(function (layer) {
        if (!!layer.toGeoJSON) {
          if (layer?.feature?.properties?.DESCRIPTOR && strcmp(layer?.feature?.properties?.DESCRIPTOR, 'LOADED_AGRI_PARCEL')) {
            Map.removeLayer(layer);
          }
        }
      });

      setState({ parcelsHaveBeenLoaded: false })
      store.dispatch({ parcelsHaveBeenLoaded: false })
    }
  }

  const enable = () => {
    store.dispatch({ processID: _id });
    setState({ isGuided: true });

    if (agriParcels.length > 0) {
      agriParcels.forEach(ap => setLayerEvents(ap, agriParcels))
    }

    Map.on('click', e => {
      const p = Map.transform(e.latlng);
      setState({ loading: true });
      const url = `/lpis/geometry/get/point/{init.token}/AGRI_PARCEL/${p.x}/${p.y}`
      http.call('get-parcel-info', { url, responseType: 'arraybuffer' }).then(response => {
        setState({ loading: false })
        const data = geobuf.decode(protobuf(response));
        const geojson = factory.geoJSON(data, apConfig.pathOptions);
        const layers = geojson.getLayers();
        if (layers && Array.isArray(layers) && layers.length > 0) {
          layers.forEach(layer => {
            if (layer?.feature?.properties) {
              layer.feature.properties.DESCRIPTOR = 'LOADED_AGRI_PARCEL'
            }
            if (!strcmp(layer.feature.properties.status, 'VALID')) {
              layer.options.color = '#FFA500'
              layer.options.fillColor = '#FFA500'
            }
            setLoadedParcelLabel(layer)
            layer.addTo(Map)
          });
          store.dispatch({ parcelsHaveBeenLoaded: true })
          setState({ parcelsHaveBeenLoaded: true })
        } else {
          alertUser(true, 'info', 'Не е избрана парцела од мапата')
          disable()
        }
      }).catch(err => {
        console.error(err)
        alertUser(true, 'error', 'Настана грешка')
        disable()
        setState({ loading: false, isGuided: false, parcelsHaveBeenLoaded: false })
        store.dispatch({ processID: '', parcelsHaveBeenLoaded: false })
      })
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
    return <Guidance id={_id} disable={disable} msg={loadParcelMsg} title='Вчитај парцела' />
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

export const Load = core.connect((state) => ({
  processID: state.app.processID,
  farmObjId: state.farmRegistry?.farmObjId,
  agriParcels: state.farmRegistry?.agriParcels,
  parcelsHaveBeenLoaded: state.farmRegistry?.parcelsHaveBeenLoaded,
}))(_Load);
