import { React, Loading, elements } from 'perun-core';
import { core, ui, tools, config as cfg } from '../../../../Spatial';
import { config, drawAPWithLineMsg, permanentCropSchema } from '../Config';
import { bufferToString, getFarmMapAssets, getLabel, isJSON } from '../../../Util';
import { saveAP } from '../SaveAP';
import { Guidance } from '../Guidance';
import { Form } from '../Form';
import { ProcessButton } from '../../ProcessButton';
import { getParcelInfo } from './Load';

const { Map, store, factory, http } = core;
const { draw: { line } } = tools;
const { Icon, DrawActions } = ui;
const { MIN_DIGI_SCALE, MAP_CONFIG } = cfg;
const { alertUser } = elements;
const { useReducer } = React;
const _id = 'drawAPWithLine';
const _iconId = 'selection';

const _DrawWithLine = ({ processID, farmObjId, saveIsPending }) => {
  const [{ layer, X, Y, data, geojson, isGuided, showForm, showPermanentCropForm, permanentCropData }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { layer: {}, X: 0, Y: 0, data: {}, geojson: {}, isGuided: false, showForm: false, showPermanentCropForm: false, permanentCropData: {} });

  const _enableLine = () => {
    line.enable(config, 12, 18, false);
    Map.off('click', _setPointMarker)
    Map.on('new_shape', e => {
      if (e && e.layer) {
        setState({ layer: e.layer, isGuided: false, showForm: true, showPermanentCropForm: false })
        e.layer.addTo(Map)
      }
      Map.off('new_shape contextmenu');
    });
  }

  const _setPointMarker = e => {
    const latLng = e.latlng
    const point = Map.transform(latLng);
    setState({ X: point.x, Y: point.y })
    // Create a marker & add it to the map
    const markerConfig = { icon: factory.divIcon({ className: 'marker-icon' }) }
    const marker = factory.marker(latLng, markerConfig)
    marker.addTo(Map)
    // Enable the line-drawing process
    _enableLine()
  }

  const enable = () => {
    Map.on('click', _setPointMarker)

    Map.on('contextmenu', e => {
      const p = Map.transform(e.latlng);
      getParcelInfo(p)
    })

    setState({ isGuided: true, showForm: false, data: {}, layer: {}, X: 0, Y: 0 });
    store.dispatch({ processID: _id, minZoom: MIN_DIGI_SCALE });
  };

  const reset = () => {
    // Reset state, internal and application-wide.
    setState({ layer: {}, X: 0, Y: 0, data: {}, geojson: {}, isGuided: false, showForm: false, showPermanentCropForm: false, permanentCropData: {} });
    store.dispatch({ processID: '', minZoom: MAP_CONFIG.minZoom, maxZoom: MAP_CONFIG.maxZoom });
    // We remove the working geometry, save process will add the result.
    layer.removeFrom && layer.removeFrom(Map);
    // Disable draw handler.
    line.disable('force');
    // Disable the contextmenu event
    Map.off('contextmenu');
    // Refresh the data
    getFarmMapAssets();
  }

  const disable = (data, geojson) => {
    if (data && data.LAND_COVER_CODE) {
      if (Number(data.LAND_COVER_CODE) >= 400 && Number(data.LAND_COVER_CODE) < 500) {
        store.dispatch({ processID: _id });
        setState({ data: {}, geojson, showPermanentCropForm: true, isGuided: false, showForm: false })
      } else {
        reset()
      }
    } else {
      reset()
    }
  };

  const onChange = ({ formData }) => {
    setState({ data: { ...data, ...formData } });
  }

  const onPermanentCropChange = ({ formData }) => {
    setState({ permanentCropData: { ...permanentCropData, ...formData } });
  }

  const onSubmit = ({ formData }) => {
    saveAP(JSON.stringify({
      ...data,
      ...formData,
      OBJECT_ID: 0,
      parent_id: farmObjId,
      X,
      Y,
      GEOM: factory.GeoJSON.fromLayer(layer)
    }), disable);
  }

  const submitPermanentCrop = data => {
    const url = `/lpis/save/permanentCrop/{init.token}/0/${farmObjId}`
    http.call(_id, { url, method: 'post', data, responseType: 'arraybuffer' }).then(res => {
      const parsedResponse = bufferToString(res.data)
      let title = 'Успешно додадени информации за повеќегодишна култура'
      if (isJSON(parsedResponse)) {
        const jsonResponse = JSON.parse(parsedResponse)
        title = jsonResponse.label_code || title
        alertUser(true, jsonResponse.type?.toLowerCase() || 'success', title)
        disable()
      } else {
        alertUser(true, 'success', title)
        disable()
      }
    }).catch(err => {
      const { response } = err
      const parsedResponse = bufferToString(response)
      console.error(parsedResponse)
      alertUser(true, 'error', 'Настана грешка')
      disable()
    })
  }

  const onPermanentCropSubmit = ({ formData }) => {
    // Clone the object first, don't use it directly as a function argument
    const data = formData
    const parcelId = geojson[0].feature.id
    const oldId = geojson[0].feature.properties.OLD_ID || 0
    const isEmpty = Object.values(data).every(v => v === null || v === undefined || v === '')
    // If the object is empty, alert the user
    if (isEmpty) {
      alertUser(true, 'info', 'Внесете вредности и обидете се повторно')
    } else {
      // Parse every value as an integer and remove the empty ones
      Object.keys(data).forEach(k => {
        if (data[k]) {
          data[k] = parseInt(data[k])
        } else {
          delete data[k]
        }
      })
      // Append the parcel object ID & the OLD ID to the form data object
      Reflect.set(data, 'PARCEL_ID', Number(parcelId))
      Reflect.set(data, 'LPIS_PARCEL_ID', Number(oldId))
      submitPermanentCrop(JSON.stringify(data))
    }
  }

  const renderGuideForm = () => {
    return <Guidance id={_id} title='Нацртај парцела (со линија)'
      finish={() => line._finishShape()}
      undo={() => line._removeLastVertex()}
      disable={disable}
      msg={drawAPWithLineMsg}
    />
  }

  const renderForm = () => {
    return <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
      <DrawActions cancel={disable} />
    </Form>
  }

  const renderPermanentCropForm = () => {
    const { schema } = permanentCropSchema
    return <Form isSimple formTitle='Повеќегодишна култура'
      onSubmit={onPermanentCropSubmit}
      formData={permanentCropData}
      onChange={onPermanentCropChange}
      schema={schema}
    ><DrawActions cancel={disable} />
    </Form>
  }

  const renderComponent = () => {
    let componentToRender = null

    if (isGuided && !showForm && !showPermanentCropForm) {
      componentToRender = renderGuideForm()
    } else if (showForm && !isGuided && !showPermanentCropForm) {
      componentToRender = renderForm()
    } else if (showPermanentCropForm && !showForm && !isGuided) {
      componentToRender = renderPermanentCropForm()
    }

    return componentToRender
  }

  return <ProcessButton id={_id} onClick={enable} title={getLabel('draw_with_line')} className='mr-2'>
    <Icon name={_iconId} size='30px' />
    {processID === _id && renderComponent()}
    {saveIsPending && <Loading />}
  </ProcessButton>;
}

export const DrawWithLine = core.connect(state => ({
  processID: state.app.processID, saveIsPending: state.farmRegistry?.saveIsPending, farmObjId: state.farmRegistry?.farmObjId
}))(_DrawWithLine)
