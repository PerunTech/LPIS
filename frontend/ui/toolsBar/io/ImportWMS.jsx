import { React, Loading, elements } from 'perun-core';
import { nanoid } from 'nanoid'
import { ProcessButton } from '../ProcessButton';
import { core, ui } from '../../../Spatial';
import { getFarmMapAssets, getLabel } from '../../Util';
import { eraseIoLayers } from './Util';
import { Guidance } from '../agriParcel/Guidance';

const { Button, Icon, DrawActions, Modal } = ui;
const { store, http } = core;
const { alertUser } = elements;
const { useEffect, useReducer } = React;
const _id = 'import-wms';

const _ImportWMS = ({ processID, selectedWmsFeature, systemLayers, farmObjId }) => {
  const [{ isGuided, showForm, loading, layerContent, layerName }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }), { isGuided: false, showForm: false, loading: false, layerContent: undefined, layerName: '' });

  useEffect(() => {
    if (processID === _id && selectedWmsFeature) {
      setState({ layerContent: selectedWmsFeature, isGuided: false, showForm: true })
    }
  }, [processID, selectedWmsFeature])

  const handleClick = () => {
    store.dispatch({ processID: _id })
    setState({ isGuided: true, showForm: false })
  };

  const disable = () => {
    store.dispatch({ processID: '', selectedWmsFeature: undefined });
    setState({ isGuided: false, showForm: false, loading: false, layerContent: undefined, layerName: '' })
    eraseIoLayers()
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const parentId = farmObjId || 0
    http.call('save_wms_layer', {
      method: 'post',
      url: `/spatial/save/{init.token}/${layerName}/${parentId}`,
      data: JSON.stringify(layerContent),
    }).then(_response => {
      alertUser(true, 'success', `${getLabel('successfully_saved')}`)
      disable()
      if (farmObjId) {
        getFarmMapAssets()
      }
    }).catch(err => {
      console.error(err)
      const title = err.response?.data?.title || err
      const msg = err.response?.data?.message || ''
      alertUser(true, "error", title, msg);
      disable()
    })
  }

  const renderForm = () => {
    const numberOfLayers = selectedWmsFeature?.features?.length || 0

    if (numberOfLayers > 0) {
      return (
        <Modal id='measure-dialog'
          show
          backdrop={false}
          enforceFocus={false}
          container={document.getElementsByClassName('control-map')[0]} >
          <Modal.Title>
            <Button disabled className='as-label ap-modal-title' >{getLabel('import_wms_layer')}</Button>
            <DrawActions cancel={disable} />
          </Modal.Title>
          <Modal.Body className='ap-modal-body import-shp-modal-body'>
            <h5>{getLabel('number_of_layers')}: {numberOfLayers}</h5>
            <p className='import-layer-list-of-layers'>{getLabel('list_of_layers')}</p>
            <div className='import-layer-main-container'>
              {selectedWmsFeature?.features?.map(layer => {
                return (
                  layer?.properties ? <div key={nanoid(4)} className='border import-layer-container'>
                    {Object.entries(layer.properties).map(([key, value], i, properties) => {
                      return (
                        <div key={nanoid(4)} className='import-layer-item'>
                          <span className={`mb-1 import-layer-span ${i === properties.length - 1 && 'import-layer-last-element'}`}><div className='import-layer-key ml-1'>{key}</div> <div className='import-layer-border'></div><div className='ml-1 import-layer-value'>{value}</div></span>
                        </div>
                      )
                    })}
                  </div> : <p>{getLabel('layer_has_no_properties')}</p>
                )
              })}
            </div>
            <div className='m-2'>
              <form onSubmit={onSubmit}>
                <label htmlFor='layerName'>Layer name</label>
                <select name='layerName' id='layerName' className='form-control' required value={layerName} onChange={(e) => setState({ layerName: e.target.value })}>
                  <option value='' />
                  {Object.keys(systemLayers).map((systemLayer, i) => (
                    <option key={systemLayer} id={systemLayer} value={systemLayer}>{Object.values(systemLayers)[i]}</option>
                  ))}
                </select>
                <Button type='submit' className='next mt-3' size=''>{getLabel('save')}</Button>
              </form>
            </div>
          </Modal.Body>
        </Modal>
      )
    }
  }

  const renderGuideForm = () => {
    return <Guidance id={_id} disable={disable} msg={[`${getLabel('import_wms_layer_message')}`, '']} title={`${getLabel('import_wms_layer')}`} />
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
    <div id={_id} >
      {loading && <Loading />}
      <ProcessButton
        id={_id}
        onClick={handleClick}
        className={_id}
        title={getLabel('import_wms')}>
        <Icon name={_id} size='36px' />
        <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('import_wms')}</span>
      </ProcessButton>
      {processID === _id && renderComponent()}
    </div>
  );
}

export const ImportWMS = core.connect(state => ({
  processID: state.app.processID,
  selectedWmsFeature: state.lpis?.selectedWmsFeature,
  systemLayers: state.lpis?.systemLayers,
  farmObjId: state.farmRegistry?.farmObjId,
}))(_ImportWMS)
