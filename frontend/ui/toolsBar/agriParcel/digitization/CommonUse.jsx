import { React, Loading, elements } from 'perun-core';
import { core, ui, data } from '../../../../Spatial';
import { commonUseMsg, commonUseSchema } from '../Config';
import { ProcessButton } from '../../ProcessButton';
import { Guidance } from '../Guidance';
import { Form } from '../Form';
import { getFarmMapAssets, getLabel, strcmp } from '../../../Util';

const { Map, connect, store, http } = core;
const { geobuf, protobuf } = data;
const { Icon, DrawActions } = ui;
const { alertUser } = elements;
const { useReducer } = React;
const _id = 'commonUse';
const _secondaryId = 'getCommonUse';
const _iconId = 'drawAP';

const _CommonUse = ({ processID, farmObjId, agriParcels }) => {
  const [{ data, loading, isGuided, showForm, showDeleteBtn, selectedParcel }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { data: {}, loading: false, isGuided: false, showForm: false, showDeleteBtn: false, selectedParcel: {} });

  const setLayerEvents = (layer, agriParcels) => {
    layer.on('click', function () {
      setState({ data: layer.feature.properties })
      agriParcels.forEach(ap => ap.off('mouseover mouseout click'))
    })
  }

  const getCommonUse = (parcelId, selectedParcel) => {
    const url = `/lpis/get/commonUse/{init.token}/${farmObjId}/${parcelId}`
    http.call(_secondaryId, { url }).then(res => {
      if (res.data && Object.keys(res.data).length > 0) {
        if (res.data.ALLOWED_AREA) {
          const formData = { commonUseType: 'CLAIMED_AREA', value: String(res.data.ALLOWED_AREA), objectId: res.data.object_id, objectTypeId: res.data.object_type }
          setState({ data: formData, isGuided: false, showForm: true, showDeleteBtn: true, selectedParcel })
        } else if (res.data.PERCENTAGE) {
          const value = `${String(res.data.OWN_PARCEL_PARTS)}/${String(res.data.TOTAL_PARCEL_PARTS)}`
          const formData = { commonUseType: 'CLAIMED_RATIO', value, objectId: res.data.object_id, objectTypeId: res.data.object_type }
          setState({ data: formData, isGuided: false, showForm: true, showDeleteBtn: true, selectedParcel })
        }
      } else {
        setState({ isGuided: false, showForm: true, showDeleteBtn: false, selectedParcel })
      }
    }).catch(err => {
      console.error(err)
      alertUser(true, 'error', `${getLabel('something_went_wrong')}`, '')
      disable()
    })
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
      const url = `/spatial/geometry/get/point/{init.token}/AGRI_PARCEL/${p.x}/${p.y}`
      http.call('get-parcel-info', { url, responseType: 'arraybuffer' }).then(response => {
        setState({ loading: false })
        const proto = protobuf(response)
        const buff = geobuf.decode(proto)
        if (buff.features && Array.isArray(buff.features) && buff.features.length > 0) {
          const parcelId = buff.features[0].id
          const area = Math.round(buff.features[0].properties.AREA)
          const landUseCode = buff.features[0].properties.LAND_COVER_CODE
          const hasCommonUse = buff.features[0].properties.COMMON_USE
          const parentId = buff.features[0].properties.parent_id
          const selectedParcel = { parcelId, area, landUseCode }
          if (parentId && Number(parentId) !== 0) {
            if (Number(parentId) !== Number(farmObjId)) {
              const title = 'Парцелата е веќе доделена на земјоделско стопанство и истата не може да се користи за Заедничка употреба'
              alertUser(true, 'info', title)
              disable()
            } else {
              if (!strcmp(landUseCode, '200') && !strcmp(landUseCode, '310') && !strcmp(landUseCode, '320')) {
                const title = 'Само парцели со код на употреба 200 (нива), 310 (ливада) и 320 (пасиште) може да се користат за заедничка употреба'
                alertUser(true, 'warning', title)
                disable()
              } else {
                const title = 'Дали сакате парцелата да се промени во парцела со Заедничка употреба?'
                const confirm = () => setState({ isGuided: false, showForm: true, showDeleteBtn: false, selectedParcel })
                alertUser(true, 'info', title, '', confirm, disable, true, 'Да', 'Не')
              }
            }
          } else if (!strcmp(landUseCode, '200') && !strcmp(landUseCode, '310') && !strcmp(landUseCode, '320')) {
            const title = 'Само парцели со код на употреба 200 (нива), 310 (ливада) и 320 (пасиште) може да се користат за заедничка употреба'
            alertUser(true, 'warning', title)
            disable()
          } else if (hasCommonUse) {
            getCommonUse(parcelId, selectedParcel)
          } else {
            setState({ isGuided: false, showForm: true, showDeleteBtn: false, selectedParcel })
          }
        } else {
          alertUser(true, 'info', 'Не е избрана парцела од мапата')
          disable()
        }
      }).catch(err => {
        console.error(err)
        alertUser(true, 'error', `${getLabel('something_went_wrong')}`)
        disable()
        setState({ loading: false, isGuided: false, showForm: false, showDeleteBtn: false })
      })

      Map.off('click')
    })
  };

  const disable = () => {
    // Remove the Map click event listener
    Map.off('click');
    // Reset state, internal and application-wide.
    setState({ data: {}, loading: false, isGuided: false, showForm: false, showDeleteBtn: false, selectedParcel: {} });
    store.dispatch({ processID: '' });
    // Reload the data
    getFarmMapAssets();
  };

  const submitCommonUse = formData => {
    const { parcelId } = selectedParcel
    const { objectId } = data
    const commonUseObjId = objectId || 0
    const url = `/lpis/save/commonUse/{init.token}/${commonUseObjId}/${farmObjId}/${parcelId}`
    http.call(_id, { url, method: 'post', data: formData }).then(res => {
      const responseType = res.data.type || 'INFO'
      const labelCode = res.data.label_code || 'Успешно додадена заедничка употреба'
      alertUser(true, responseType.toLowerCase(), labelCode)
      disable()
    }).catch(err => {
      const { response } = err
      let message = ''
      if (response.data && response.data.title) {
        if (response.data.title?.includes('allowedAreaCannotBeBiggerThanArea')) {
          message = 'Површината за заедничка употреба не може да биде поголема од површината на парцелата'
        } else {
          message = response.data.title || response.data.message || ''
        }
      }
      alertUser(true, 'error', `${getLabel('save_failed')}`, message);
    })
  }

  const onSubmit = ({ formData }) => {
    const data = { [formData.commonUseType]: formData.value }
    submitCommonUse(JSON.stringify(data))
  }

  const onChange = ({ formData }) => setState({ data: { ...data, ...formData } });

  const deleteCommonUse = () => {
    const { objectId, objectTypeId } = data
    http.call('delete-common-use', {
      url: '/ReactElements/deleteObject/{init.token}',
      method: 'post',
      data: JSON.stringify({ OBJECT_ID: objectId, OBJECT_TYPE: objectTypeId })
    }).then(() => {
      alertUser(true, 'success', `${getLabel('success_delete')}`);
      disable()
    }).catch(() => {
      alertUser(true, 'error', `${getLabel('error_delete')}`);
      disable()
    })
  }

  const deleteCommonUsePrompt = () => {
    const title = `${getLabel('delete_common_use_confirmation')}`
    alertUser(true, 'warning', title, '', () => deleteCommonUse(), () => { }, true, `${getLabel('yes')}`, `${getLabel('no')}`)
  }

  const renderGuideForm = () => {
    return <Guidance id={_id} disable={disable} title='Заедничка употреба' msg={commonUseMsg} />
  }

  const renderForm = () => {
    const { area, landUseCode } = selectedParcel
    const parcelData = <div className='p-2'>
      <p style={{ fontSize: 'small', fontWeight: '700' }}>{getLabel('chosen_parcel_info')}</p>
      <div className='d-flex flex-row justify-content-center align-items-center mt-1 mb-n1' style={{ fontSize: 'small' }}>
        <p className='mr-1'>{getLabel('area')}: {area} m²</p>
        <p>{getLabel('class')}: {landUseCode}</p>
      </div>
    </div>

    const { schema, uiSchema } = commonUseSchema

    const formProps = {
      isSimple: true,
      className: 'common-use-form',
      formTitle: `${getLabel('common_use')}`,
      onSubmit,
      formData: data,
      onChange,
      schema,
      uiSchema,
      showDeleteBtn,
      onDeleteFn: deleteCommonUsePrompt
    }

    return (
      <Form {...formProps}>
        <DrawActions cancel={disable} />
        {parcelData}
      </Form>
    )
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

  return (
    <ProcessButton id={_id} onClick={enable} title={getLabel('common_use')}>
      <Icon name={_iconId} size='30px' />
      <span style={{ display: "block", marginTop: '5px' }}>{getLabel('common_use')}</span>
      {processID === _id && renderComponent()}
      {loading && <Loading />}
    </ProcessButton>
  );
};

export const CommonUse = connect((state) => ({
  processID: state.app.processID,
  farmObjId: state.farmRegistry?.farmObjId,
  agriParcels: state.farmRegistry?.agriParcels,
}))(_CommonUse);
