import { React, Loading, elements } from 'perun-core';
import { core, ui, data } from '../../../../Spatial';
import { assignAPMsg, config } from '../Config';
import { bufferToString, decodeResponse, getFarmMapAssets, isJSON, strcmp } from '../../../Util';
import { Guidance } from '../Guidance';
import { ProcessButton } from '../../ProcessButton';

const { Map, store, factory, http } = core;
const { geobuf, protobuf } = data;
const { Icon } = ui;
const { useReducer } = React;
const { alertUser } = elements;
const _id = 'assignAP';

const _Assign = ({ processID, farmObjId }) => {
  const [{ layer, data, X, Y, loading, isGuided }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { layer: {}, data: {}, X: 0, Y: 0, loading: false, isGuided: false });

  const enable = () => {
    store.dispatch({ processID: _id });
    setState({ isGuided: true })

    // Click handler for selection of location and creation of crop parcel geometry.
    Map.on('click', e => {
      const p = Map.transform(e.latlng);
      setState({ X: p.x, Y: p.y, loading: true });

      http.call('assign-agri', {
        url: `/lpis/add/farm/{init.token}/${farmObjId}/AGRI_PARCEL/${p.x}/${p.y}`,
        method: 'post',
        responseType: 'arraybuffer',
        // data: JSON.stringify(factory.GeoJSON.fromLayer(e.layer)),
      })
        .then(response => {
          setState({ loading: false, isGuided: false })
          const proto = protobuf(response);
          const buff = geobuf.decode(proto);
          const geojson = factory.geoJSON(buff, config.pathOptions);

          geojson.getLayers().forEach(layer => {
            // Flatten the geometry array, so utilities can read the thing. god knows why this happens.
            //layer.setLatLngs([...util.flattenDeep(layer.getLatLngs())])

            // assign metadata
            layer.feature.id = 0
            layer.feature.properties = { parent_id: farmObjId }

            layer.addTo(Map);
            setState({ data: layer.feature.properties, layer: layer })
          })
        })
        .catch(err => {
          console.log(err.response)
          setState({ loading: false, isGuided: false })
          // Get the stringified response from the array buffer
          const stringfiedResponse = bufferToString(err.response.data)
          // Temporary workaround for the issue with using the INTL context in spatial modules
          let translatedError = ''
          if (isJSON(stringfiedResponse) && Object.keys(JSON.parse(stringfiedResponse)).length > 1) {
            const parsedResponse = JSON.parse(stringfiedResponse)
            if (parsedResponse.parent_id && parsedResponse.parent_id !== farmObjId) {
              translatedError = 'Избраната парцела веќе има назначено стопанство'
              handleOverlap(translatedError, p.x, p.y)
            } else {
              alertUser(true, 'error', 'Избраната парцела веќе има назначено стопанство', '', () => disable())
            }
          } else {
            if (strcmp(typeof stringfiedResponse, 'string')) {
              if (strcmp(stringfiedResponse, 'err.no_parcel.selected')) {
                translatedError = 'Не е избрана парцела од мапата'
                alertUser(true, 'error', 'Настана грешка', translatedError, () => disable())
              } else if (stringfiedResponse.includes('err.no_parcel.selected')) {
                alertUser(true, 'error', 'Избраната парцела веќе има назначено стопанство', '', () => disable())
              } else {
                alertUser(true, 'error', 'Настана грешка', '', () => disable())
              }
            }
          }
        });

      Map.off('click');
    });
  };

  const disable = (responseType, response, isLoading) => {
    if (isLoading) {
      setState({ loading: true })
    } else {
      setState({ loading: false })
      if (strcmp(responseType, 'error')) {
        const errorMsg = decodeResponse(response)
        elements.alertUser(true, 'error', 'Грешка при зачувување', errorMsg);
      } else {
        Map.off('click');
        // Reset state, internal and application-wide.
        setState({ layer: {}, data: {}, X: 0, Y: 0, loading: false, enumIdx: [], enumNames: [], isGuided: false });
        store.dispatch({ processID: '' });
        // We remove the working geometry, save process will add the result.
        layer.removeFrom && layer.removeFrom(Map);
        getFarmMapAssets();
      }
    }
  }

  const handleOverlap = (translatedError, x, y) => {
    const msg = 'Доколку продолжите ќе биде регистриран целосен преклоп на двете стопанската и парцелата ќе биде оневозможена за понатамошна употреба.'
    elements.alertUser(true, 'warning', translatedError, msg, () => confirmOverlap(x, y), () => disable(), true, 'Продолжи', 'Откажи')
  }

  const confirmOverlap = (x, y) => {
    const url = `/lpis/overlap/farm/{init.token}/${farmObjId}/AGRI_PARCEL/${x}/${y}`
    http.call('assign-agri', { url, method: 'post' }).then(response => {
      if (response.data) {
        alertUser(true, 'info', response.data || '')
      }
    }).catch(err => {
      const { response } = err
      alertUser(true, 'error', 'Настана грешка', response.data || '', () => disable())
    })
  }

  const renderForm = () =>
  (isGuided
    ? <Guidance id={_id} disable={disable} msg={assignAPMsg} title='Назначи стопанство' />
    : <></>);


  return <ProcessButton id={_id} onClick={enable} >
    <Icon name={_id} size='30px' />
    <span style={{ display: 'block', marginTop: '5px' }}>Назначи стопанство</span>
    {processID === _id
      && renderForm()}
    {loading && <Loading />}
  </ProcessButton>;
};

export const Assign = core.connect(state => ({
  processID: state.app.processID, mapId: state.map.id, farmObjId: state.farmRegistry?.farmObjId
}))(_Assign)
