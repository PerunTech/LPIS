import { React, Loading, elements } from 'perun-core';
import { core, ui, config } from '../../../../Spatial';
import { permanentCropsMsg, permanentCropSchema } from '../Config';
import { bufferToString, getFarmMapAssets, isJSON } from '../../../Util';
import { Guidance } from '../Guidance';
import { Form } from '../Form';
import { ProcessButton } from '../../ProcessButton';

const { MIN_DIGI_SCALE, MAP_CONFIG } = config;
const { Map, store, http } = core;
const { Icon, DrawActions, Button, Modal } = ui;
const { alertUser } = elements;
const { useReducer } = React;

const _id = 'permanentCrops';
const _iconId = 'map-report';

const _PermanentCrops = ({ processID, farmObjId, agriParcels }) => {
  const [{ layer, data, loading, isGuided, showForm, allPermanentCrops }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { layer: {}, data: {}, loading: false, isGuided: false, showForm: false, allPermanentCrops: undefined });

  const getPermanentCrops = parcelId => {
    setState({ loading: true })
    const url = `/lpis/get/permanentCrop/{init.token}/${parcelId}`
    http.call('get_permanent_crops', { url }).then(res => {
      setState({ loading: false })
      if (res.data) {
        if (Array.isArray(res.data.items) && res.data.items?.length > 0) {
          const formData = res.data.items[0]
          Object.keys(formData).forEach(k => {
            formData[k] = '' + formData[k]
          })
          setState({ data: formData, allPermanentCrops: res.data.items, isGuided: false, showForm: true })
        } else {
          setState({ data: {}, isGuided: false, showForm: true })
        }
      }
    }).catch(err => {
      console.error(err)
      setState({ loading: false, data: {}, isGuided: false, showForm: true })
    })
  }

  const initEdit = layer => {
    // Get the permanent crops for the selected parcel (if it meets the criteria for having permanent crops)
    const parcelId = layer.feature.id
    const landCoverCode = layer.feature.properties.LAND_COVER_CODE
    if (Number(landCoverCode) >= 400 && Number(landCoverCode) < 500) {
      getPermanentCrops(parcelId)
      // Move map view on top of selected polygon.
      Map.fitBounds(layer.getBounds());
      setState({ layer })
    } else {
      const title = 'Заедничка употреба може да се додаде само за следниве употреби на земјиште:'
      const msgOne = 'Долгогодишни култури (траен насад), Лозов насад, Овоштарник, Маслинов насад, Овошен насад'
      const msgTwo = ', Јаткасто овошје, Растенија со брзо растечка маса, Мешани трајни насади'
      alertUser(true, 'warning', title, msgOne + msgTwo, disable)
    }
  }

  const _setBlockEvents = (layer, agriParcels) => {
    layer.on('mouseover', function () { this.setStyle({ color: '#eed000', fillColor: '#000000' }) })
      .on('mouseout', function () { this.setStyle({ color: '#3399ff', fillColor: '#3388ff' }) })
      .on('click', function () {
        initEdit(this);
        agriParcels.forEach(ap => ap.off('mouseover mouseout click'))
      }).bringToFront();
  }

  const enable = () => {
    if (agriParcels.length > 0) {
      agriParcels.forEach(sc => _setBlockEvents(sc, agriParcels))
      store.dispatch({ processID: _id, minZoom: MIN_DIGI_SCALE });
      setState({ isGuided: true, showForm: false, data: {}, allPermanentCrops: undefined })
    } else {
      alertUser(true,
        'warning',
        'Не се пронајдени земјоделски парцели.',
        'Додадете земјоделски парцели пред да ја користите алатката за менување.',
        () => disable());
    }
  }

  const disable = () => {
    Map.off('click');
    // Reset state, internal and application-wide.
    setState({ layer: {}, data: {}, isGuided: false, showForm: false, loading: false, allPermanentCrops: undefined });
    store.dispatch({ processID: '', minZoom: MAP_CONFIG.minZoom });
    // We remove the working geometry, save process will add the result.
    getFarmMapAssets()
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

  const onChange = ({ formData }) => {
    setState({ data: { ...data, ...formData } });
  }

  const onSubmit = ({ formData }) => {
    // Clone the object first, don't use it directly as a function argument
    const data = formData
    const parcelId = layer.feature.id
    const oldId = layer.feature.properties.OLD_ID || 0
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
    return <Guidance id={_id} disable={() => disable()} msg={permanentCropsMsg} title='Долгогодишни култури' />
  }

  const renderForm = () => {
    let permanentCropsModalClassName = ''
    const { schema } = permanentCropSchema
    const currentPermanentCropId = data.object_id
    let additionalCropsContainer = null
    if (allPermanentCrops && Array.isArray(allPermanentCrops) && allPermanentCrops.length >= 1) {
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
        setState({ data: permanentCrop })
      }

      const resetForm = () => {
        setState({ data: {} })
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
        onSubmit={onSubmit}
        formData={data}
        onChange={onChange}
        schema={schema}
      ><DrawActions cancel={disable} />
      </Form>
    </React.Fragment>
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
    <Icon name={_iconId} size='30px' />
    <span style={{ display: 'block', marginTop: '5px' }}>Долгогодишни култури</span>
    {processID === _id && renderComponent()}
    {loading && <Loading />}
  </ProcessButton>;
}

export const PermanentCrops = core.connect(state => ({
  processID: state.app.processID, farmObjId: state.farmRegistry?.farmObjId, agriParcels: state.farmRegistry?.agriParcels
}))(_PermanentCrops)
