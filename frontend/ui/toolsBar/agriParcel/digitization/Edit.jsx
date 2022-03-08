import { React, Loading, elements } from 'perun-core';
import { core, ui, tools, config as cfg } from '../../../../Spatial';
import { config, editAPMsg, permanentCropSchema } from '../Config';
import { bufferToString, getFarmMapAssets, isJSON } from '../../../Util';
import { saveAP } from '../SaveAP';
import { GuideForm } from '../GuideForm';
import { Form } from '../Form';
import { ProcessButton } from '../../ProcessButton';

const { MIN_DIGI_SCALE, MAP_CONFIG } = cfg;
const { Map, store, factory, http } = core;
const { edit } = tools;
const { Icon, DrawActions, Button, Modal } = ui;
const { alertUser } = elements;
const { useReducer } = React;

const _id = 'editAP';
const _layerGroup = factory.layerGroup();

const _Edit = ({ processID, farmObjId, agriParcels }) => {
  const [{ layer, geojson, data, permanentCropData, loading, isGuided, showForm, showPermanentCropForm, allPermanentCrops }, setState] = useReducer(
    (currState, update) => ({ ...currState, ...update }),
    {
      layer: {}, data: {}, geojson: {}, permanentCropData: {}, loading: false,
      isGuided: false, showForm: false, showPermanentCropForm: false, allPermanentCrops: undefined
    });

  const enable = () => {
    if (agriParcels.length > 0) {
      agriParcels.forEach(sc => _setBlockEvents(sc, agriParcels))
      store.dispatch({ processID: _id, minZoom: MIN_DIGI_SCALE });
      setState({ isGuided: true, showForm: false, showPermanentCropForm: false, data: {}, permanentCropData: {}, layer: {}, allPermanentCrops: undefined })
      _editAP()
    } else {
      alertUser(true,
        'warning',
        'Не се пронајдени земјоделски парцели.',
        'Додадете земјоделски парцели пред да ја користите алатката за менување.',
        () => disable());
    }
  };

  const reset = () => {
    Map.off('click');
    // Reset state, internal and application-wide.
    setState({
      layer: {}, data: {}, geojson: {}, permanentCropData: {}, isGuided: false,
      showForm: false, showPermanentCropForm: false, loading: false, allPermanentCrops: undefined
    });
    store.dispatch({ processID: '', minZoom: MAP_CONFIG.minZoom });
    // We remove the working geometry, save process will add the result.
    layer.removeFrom && layer.removeFrom(Map);
    getFarmMapAssets()
    _stopEditAP()
  }

  const disable = (data, geojson) => {
    if (data && data.LAND_COVER_CODE) {
      if (Number(data.LAND_COVER_CODE) >= 400 && Number(data.LAND_COVER_CODE) < 500) {
        const parcelId = geojson[0].feature.id
        getPermanentCrop(parcelId, geojson)
      } else {
        reset()
      }
    } else {
      reset()
    }
  }

  const getPermanentCrop = (parcelId, geojson) => {
    _stopEditAP()
    setState({ loading: true })
    const url = `/lpis/get/permanentCrop/{init.token}/${parcelId}`
    http.call('get_permanent_crop', { url }).then(res => {
      setState({ loading: false })
      store.dispatch({ processID: _id })
      if (res.data) {
        if (Array.isArray(res.data.items) && res.data.items?.length > 0) {
          const formData = res.data.items[0]
          Object.keys(formData).forEach(k => {
            formData[k] = '' + formData[k]
          })
          setState({
            data: {}, allPermanentCrops: res.data.items, permanentCropData: formData, geojson,
            showPermanentCropForm: true, isGuided: false, showForm: false
          })
        } else {
          setState({ data: {}, geojson, showPermanentCropForm: true, isGuided: false, showForm: false })
        }
      }
    }).catch(err => {
      console.error(err)
      setState({ loading: false, data: {}, geojson, showPermanentCropForm: true, isGuided: false, showForm: false })
      store.dispatch({ processID: _id })
    })
  }

  const _editAP = () => {
    const currZoom = Map.getZoom();
    // This line ensures no racing codition on the current bounding box.
    // We set view manually before calling Map.getBBox in _fetchBlocks and bbox will NOT contain a whole country.
    Map.setView(Map.getCenter(), currZoom < MIN_DIGI_SCALE ? MIN_DIGI_SCALE : currZoom); // zoom is inverse to scale
    _layerGroup.addTo(Map);
  }

  const _stopEditAP = () => {
    _layerGroup.clearLayers().removeFrom(Map);
    edit.polygon.disable();
  }

  const _setBlockEvents = (layer, agriParcels) => {
    layer.on('mouseover', function () { this.setStyle({ color: '#eed000', fillColor: '#000000' }) })
      .on('mouseout', function () { this.setStyle({ color: '#3399ff', fillColor: '#3388ff' }) })
      .on('click', function () {
        initEdit(this);
        agriParcels.forEach(ap => ap.off('mouseover mouseout click'))
      }).bringToFront();
  }

  const initEdit = layer => {
    // Move map view on top of selected polygon.
    Map.fitBounds(layer.getBounds());

    // Activate edit handler on selected polygon
    edit.polygon.enable(layer, config);
    setState({ layer: layer, data: layer.feature.properties, isGuided: false, showForm: true });

    // Activate edit event listeners on layer.
    layer.on('pm:edit', e => setState({ layer: e.target }));
  }

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
      OBJECT_ID: Number(layer.feature.id),
      parent_id: farmObjId,
      GEOM: factory.GeoJSON.fromLayer(layer)
    }), disable);
  }

  const submitPermanentCrop = (data, permanentCropObjId) => {
    const url = `/lpis/save/permanentCrop/{init.token}/${permanentCropObjId}/${farmObjId}`
    http.call(_id, { url, method: 'post', data, responseType: 'arraybuffer' }).then(res => {
      const parsedResponse = bufferToString(res.data)
      let title = 'Успешно додадени информации за повеќегодишна култура'
      if (isJSON(parsedResponse)) {
        const jsonResponse = JSON.parse(parsedResponse)
        alertUser(true, jsonResponse.type?.toLowerCase() || 'success', jsonResponse.label_code || title, '', () => disable())
      } else {
        alertUser(true, 'success', title, '', () => disable())
      }
    }).catch(err => {
      const { response } = err
      const parsedResponse = bufferToString(response)
      console.error(parsedResponse)
      alertUser(true, 'error', 'Настана грешка', '', () => disable())
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
      const permanentCropObjId = data.object_id || 0
      // Append the parcel object ID & the OLD ID to the form data object
      Reflect.set(data, 'PARCEL_ID', Number(parcelId))
      Reflect.set(data, 'LPIS_PARCEL_ID', Number(oldId))
      submitPermanentCrop(JSON.stringify(data), permanentCropObjId)
    }
  }

  const renderGuideForm = () => {
    return <GuideForm id={_id} disable={() => disable()} msg={editAPMsg} title='Промени земјоделска парцела' />
  }

  const renderForm = () => {
    return (
      <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
        <DrawActions cancel={() => disable()} />
      </Form>
    )
  }

  const renderPermanentCropForm = () => {
    let permanentCropsModalClassName = ''
    const { schema } = permanentCropSchema
    const currentPermanentCropId = permanentCropData.object_id
    let additionalCropsContainer = null
    if (allPermanentCrops && Array.isArray(allPermanentCrops) && allPermanentCrops.length > 1) {
      permanentCropsModalClassName = 'permanent-crops-modal'
      const modalProps = {
        show: true,
        backdrop: false,
        enforceFocus: false,
        id: 'additional-crops-dialog',
        className: 'additional-crops-modal',
        container: document.getElementsByClassName('control-map')[0]
      }

      const onClick = permanentCrop => {
        Object.keys(permanentCrop).forEach(k => {
          permanentCrop[k] = '' + permanentCrop[k]
        })
        setState({ permanentCropData: permanentCrop })
      }

      const resetForm = () => {
        setState({ permanentCropData: {} })
      }

      additionalCropsContainer = <Modal {...modalProps}>
        <Modal.Title>
          <Button disabled className='as-label ap-modal-title' >Листа на записи за Повеќегодишни култури</Button>
        </Modal.Title>
        <Modal.Body className='show-grid'>
          <div className='p-2'>
            {allPermanentCrops.map(permanentCrop => {
              return <Button key={permanentCrop.object_id} block
                className={currentPermanentCropId === permanentCrop.object_id ? 'active' : ''} onClick={() => onClick(permanentCrop)}
              >
                <span className='mr-1'>{schema.properties.PERM_CROP_TYPE_ID.enumNames[Number(permanentCrop.PERM_CROP_TYPE_ID) - 1]}</span>
                <span>({permanentCrop.NUMBER_OF_TREES} садници</span>
                <span className='mr-1'> на {Math.round(permanentCrop.PLANT_AREA)} m²)</span>
              </Button>
            })}
            <Button block variant='dark' onClick={resetForm}>Додади нов запис</Button>
          </div>
        </Modal.Body>
      </Modal>
    }

    return <React.Fragment>
      {additionalCropsContainer}
      <Form
        key={currentPermanentCropId}
        isSimple
        className={permanentCropsModalClassName}
        formTitle='Повеќегодишна култура'
        onSubmit={onPermanentCropSubmit}
        formData={permanentCropData}
        onChange={onPermanentCropChange}
        schema={schema}
      ><DrawActions cancel={disable} />
      </Form>
    </React.Fragment>
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

  return <ProcessButton id={_id} onClick={enable} title='Промени парцела' className='mr-2'>
    <Icon name={_id} size='30px' />
    <span style={{ display: 'block', marginTop: '5px' }}>Промени</span>
    {processID === _id && renderComponent()}
    {loading && <Loading />}
  </ProcessButton>;
}

export const Edit = core.connect(state => ({
  processID: state.app.processID, mapId: state.map.id, farmObjId: state.farmRegistry?.farmObjId, agriParcels: state.farmRegistry?.agriParcels
}))(_Edit)
