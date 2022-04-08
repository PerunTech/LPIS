import { React, Loading, redux, elements, createHashHistory } from 'perun-core';
import { core, ui, data } from '../../../../Spatial';
import { assignAPMsg, config } from '../Config';
import { bufferToString, getFarmMapAssets, isJSON, strcmp } from '../../../Util';
import { Guidance } from '../Guidance';
import { Form } from '../Form';
import { ProcessButton } from '../../ProcessButton';
import { saveAP } from '../SaveAP';

const { Map, store, factory, http } = core;
const { geobuf, protobuf } = data;
const { Icon, DrawActions } = ui;
const { useReducer } = React;
const { alertUser } = elements;
const { store: perunStore, logoutUser } = redux;
const history = createHashHistory();
const _id = 'assignAP';

const _Assign = ({ processID, farmObjId, saveIsPending }) => {
  const [{ layer, data, X, Y, loading, isGuided, showForm }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { layer: {}, data: {}, X: 0, Y: 0, loading: false, isGuided: false, showForm: false });

  const disable = () => {
    Map.off('click');
    // Reset state, internal and application-wide.
    setState({ layer: {}, data: {}, X: 0, Y: 0, loading: false, isGuided: false, showForm: false });
    store.dispatch({ processID: '' });
    // We remove the working geometry, save process will add the result.
    layer.removeFrom && layer.removeFrom(Map);
    getFarmMapAssets();
  }

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
      }).then(response => {
        setState({ loading: false, isGuided: false, showForm: false })
        alertUser(true, 'success', 'Успешно назначено стопанство', '', () => disable())
        const proto = protobuf(response);
        const buff = geobuf.decode(proto);
        const geojson = factory.geoJSON(buff, config.pathOptions);

        geojson.getLayers().forEach(layer => {
          // assign metadata
          layer.feature.id = 0
          layer.feature.properties = { parent_id: farmObjId }
          layer.addTo(Map);
        })
      }).catch(err => {
        console.log(err.response)
        setState({ loading: false, isGuided: false, showForm: false })
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
            translatedError = 'Избраната парцела веќе има назначено стопанство'
            if (parsedResponse.Label_Code) {
              translatedError = parsedResponse.Label_Code
              if (strcmp(parsedResponse.Label_Code, 'error.invalid_session')) {
                const url = `${window.server}/SvSecurity/logout/${perunStore.getState().security.svSession}`
                disable();
                const logout = () => {
                  perunStore.dispatch(logoutUser(url));
                  history.push('/');
                }
                alertUser(true, 'error', 'Невалидна сесија', '', () => logout())
              } else {
                alertUser(true, 'error', translatedError, '', () => disable())
              }
            } else {
              alertUser(true, 'error', translatedError, '', () => disable())
            }
          }
        } else {
          if (strcmp(typeof stringfiedResponse, 'string')) {
            if (stringfiedResponse.includes('err.no_parcel.selected')) {
              translatedError = 'Не е избрана парцела од мапата'
              alertUser(true, 'error', translatedError, '', () => disable())
            } else if (stringfiedResponse.includes('err.parcel_common_use')) {
              translatedError = 'Парцелата веќе се користи за заедничка употреба'
              alertUser(true, 'error', translatedError, '', () => disable())
            } else {
              alertUser(true, 'error', 'Настана грешка', '', () => disable())
            }
          }
        }
      });

      Map.off('click');
    });
  };

  const onChange = ({ formData }) => {
    setState({ data: { ...data, ...formData } });
  }

  const onSubmit = ({ formData }) => {
    saveAP(JSON.stringify({
      ...data,
      ...formData,
      OBJECT_ID: 0,
      parent_id: farmObjId,
      GEOM: factory.GeoJSON.fromLayer(layer)
    }), disable);
  }

  const handleOverlap = (translatedError, x, y) => {
    const msg = 'Доколку продолжите ќе биде регистриран целосен преклоп на двете стопанства и парцелата ќе биде оневозможена за понатамошна употреба.'
    elements.alertUser(true, 'warning', translatedError, msg, () => confirmOverlap(x, y), () => disable(), true, 'Продолжи', 'Откажи')
  }

  const confirmOverlap = (x, y) => {
    const url = `/lpis/overlap/farm/{init.token}/${farmObjId}/AGRI_PARCEL/${x}/${y}`
    http.call('overlap-agri', { url, method: 'post', responseType: 'arraybuffer' }).then(response => {
      const proto = protobuf(response);
      const buff = geobuf.decode(proto);
      const geojson = factory.geoJSON(buff, config.pathOptions);
      geojson.getLayers().forEach(layer => {
        layer.feature.id = 0
        layer.addTo(Map);
        setState({ data: layer.feature.properties, layer: layer })
      })
      setState({ isGuided: false, showForm: true })
    }).catch(err => {
      const { response } = err
      console.error(response)
      alertUser(true, 'error', 'Настана грешка', '', () => disable())
    })
  }

  const renderGuideForm = () => {
    return <Guidance id={_id} disable={disable} msg={assignAPMsg} title='Назначи стопанство' />
  }

  const renderForm = () => {
    return <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
      <DrawActions cancel={disable} />
    </Form>
  }

  const renderComponent = () => {
    let componentToRender = null

    if (isGuided && !showForm) {
      componentToRender = renderGuideForm()
    } else if (showForm && !isGuided) {
      componentToRender = renderForm()
    }

    return componentToRender
  }

  return <ProcessButton id={_id} onClick={enable} >
    <Icon name={_id} size='30px' />
    <span style={{ display: 'block', marginTop: '5px' }}>Назначи стопанство</span>
    {processID === _id && renderComponent()}
    {(loading || saveIsPending) && <Loading />}
  </ProcessButton>;
};

export const Assign = core.connect(state => ({
  processID: state.app.processID, saveIsPending: state.farmRegistry?.saveIsPending, farmObjId: state.farmRegistry?.farmObjId
}))(_Assign)
