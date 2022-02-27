import { React, Loading, elements } from 'perun-core';
import { core, ui, data } from '../../../../Spatial';
import { commonUseMsg, commonUseSchema } from '../Config';
import { ProcessButton } from '../../ProcessButton';
import { GuideForm } from '../GuideForm';
import { Form } from '../Form';
import { bufferToString, decodeResponse, getFarmMapAssets } from '../../../Util';

const { Map, store, http } = core;
const { geobuf, protobuf } = data;
const { Icon, DrawActions } = ui;
const { useReducer } = React;
const _id = 'commonUse';
const _iconId = 'drawAP';

const _CommonUse = ({ processID, farmObjId }) => {
  const [{ data, loading, isGuided, showForm, selectedParcel }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { data: {}, loading: false, isGuided: false, showForm: false, selectedParcel: {} });

  const enable = () => {
    store.dispatch({ processID: _id });
    setState({ isGuided: true });

    Map.on('click', e => {
      const p = Map.transform(e.latlng);
      setState({ loading: true });
      const url = `/spatial/geometry/get/point/{init.token}/AGRI_PARCEL/${p.x}/${p.y}`
      http.call('get-parcel-info', { url, responseType: 'arraybuffer' }).then(response => {
        const proto = protobuf(response);
        const buff = geobuf.decode(proto);
        const parcelId = buff.features[0].id
        const area = Math.round(buff.features[0].properties.AREA)
        const landUseCode = buff.features[0].properties.LAND_COVER_CODE
        setState({ loading: false, isGuided: false, showForm: true, selectedParcel: { parcelId, area, landUseCode } })
      }).catch(err => {
        console.error(err)
        setState({ loading: false, isGuided: false, showForm: false })
      })

      Map.off('click')
    })
  };

  const disable = () => {
    // Remove the Map click event listener
    Map.off('click');
    // Reset state, internal and application-wide.
    setState({ layer: {}, data: {}, X: 0, Y: 0, loading: false, isGuided: false, showForm: false, selectedParcel: {} });
    store.dispatch({ processID: '' });
    // Reload the data
    getFarmMapAssets();
  };

  const submitCommonUse = data => {
    const { parcelId } = selectedParcel
    const url = `/lpis/save/commonUse/{init.token}/0/${farmObjId}/${parcelId}`
    http.call(_id, { url, method: 'post', data, responseType: 'arraybuffer' }).then(res => {
      const decodedResponse = bufferToString(res.data)
      elements.alertUser(true, 'success', decodedResponse, '', () => disable())
    }).catch(err => {
      const { response } = err
      const errorMsg = decodeResponse(response);
      elements.alertUser(true, 'error', 'Грешка при зачувување', errorMsg);
    })
  }

  const onSubmit = ({ formData }) => {
    const data = { [formData.commonUseType]: formData.value }
    submitCommonUse(JSON.stringify(data))
  }

  const onChange = ({ formData }) => setState({ data: { ...data, ...formData } });

  const renderGuideForm = () => {
    return <GuideForm id={_id} disable={disable} title='Заедничка употреба' msg={commonUseMsg} />
  }

  const renderForm = () => {
    const { area, landUseCode } = selectedParcel
    const parcelData = <div className='p-2'>
      <p style={{ fontSize: 'small', fontWeight: '700' }}>Информации за избраната парцела</p>
      <div className='d-flex flex-row justify-content-center align-items-center mt-1 mb-n1' style={{ fontSize: 'small' }}>
        <p className='mr-1'>Површина: {area} m²</p>
        <p>Класа: {landUseCode}</p>
      </div>
    </div>

    const { schema, uiSchema } = commonUseSchema

    return <Form isSimple formTitle='Заедничка употреба' onSubmit={onSubmit} formData={data} onChange={onChange} schema={schema} uiSchema={uiSchema}>
      <DrawActions cancel={disable} />
      {parcelData}
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

  return (
    <ProcessButton id={_id} onClick={enable}>
      <Icon name={_iconId} size='30px' />
      <span style={{ display: "block", marginTop: '5px' }}>Додади заедничка употреба</span>
      {processID === _id && renderComponent()}
      {loading && <Loading />}
    </ProcessButton>
  );
};

export const CommonUse = core.connect((state) => ({
  processID: state.app.processID,
  mapId: state.map.id,
  farmObjId: state.farmRegistry?.farmObjId,
}))(_CommonUse);
