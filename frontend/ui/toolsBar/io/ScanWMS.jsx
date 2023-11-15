import { React, Loading, elements } from 'perun-core';
import { ProcessButton } from '../ProcessButton';
import { core, ui } from '../../../Spatial';
import { getFarmMapAssets, getLabel } from '../../Util';

const { Button, Icon, DrawActions, Modal } = ui;
const { Map, store, http } = core;
const { alertUser, ReactBootstrap } = elements;
const { Spinner } = ReactBootstrap
const { useEffect, useReducer } = React;
const _id = 'scan-wms';

const _ScanWMS = ({ processID, systemLayers, farmObjId }) => {
  const [{
    showForm, loading, showInfoMsg, externalLayers, sourceName, sourceLayer, layerObjectId, externalLayerCode, targetLayer
  }, setState] = useReducer((currState, update) => ({ ...currState, ...update }),
    {
      showForm: false, loading: false, showInfoMsg: true, externalLayers: [], sourceName: '',
      sourceLayer: undefined, layerObjectId: undefined, externalLayerCode: '', targetLayer: ''
    });

  useEffect(() => {
    const externalLayers = store.getState().externalLayers
    if (externalLayers && Array.isArray(externalLayers) && externalLayers.length > 0) {
      setState({ externalLayers })
    }
  }, [])

  useEffect(() => {
    if (sourceName) {
      Map.on('click', handleSourceSelection)
    }

    return () => {
      Map.off('click')
    }
  }, [sourceName])

  const handleSourceSelection = (e) => {
    setState({ sourceLayer: undefined, layerObjectId: undefined, loading: true })
    const p = Map.transform(e.latlng);
    const url = `/spatial/geometry/info/{init.token}/${sourceName}/${p.x}/${p.y}`
    http.call('get-source-info', { url }).then(res => {
      setState({ loading: false })
      if (res.data && res.data.items && Array.isArray(res.data.items) && res.data.items.length > 0) {
        setState({ sourceLayer: res.data.items[0], layerObjectId: res.data.items[0].object_id })
      } else {
        setState({ sourceLayer: undefined })
        alertUser(true, 'info', getLabel('no_data_found_for_layer'))
      }
    }).catch(err => {
      console.error(err)
      setState({ loading: false })
      const title = err.response?.data?.title || err
      const msg = err.response?.data?.message || ''
      alertUser(true, 'error', title, msg);
    })
  }

  const handleClick = () => {
    store.dispatch({ processID: _id })
    setState({ showForm: true })
  };

  const disable = () => {
    store.dispatch({ processID: '' });
    setState({
      showForm: false, loading: false, sourceName: '',
      sourceLayer: undefined, layerObjectId: undefined, externalLayerCode: '', targetLayer: ''
    })
    Map.off('click')
  }

  const onChange = (e) => {
    setState({ [e.target.name]: e.target.value })
  }

  const onSubmit = (e) => {
    e.preventDefault()
    http.call('save_wms_layer', {
      method: 'get',
      url: `/spatial/scanWMSFeatureInfo/{init.token}/${sourceName}/${layerObjectId}/3/${externalLayerCode}/${targetLayer}`,
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
      alertUser(true, 'error', title, msg);
      disable()
    })
  }

  const renderForm = () => {
    return (
      <Modal id='measure-dialog'
        show
        backdrop={false}
        enforceFocus={false}
        container={document.getElementsByClassName('control-map')[0]} >
        <Modal.Title>
          <Button disabled className='as-label ap-modal-title' >{getLabel('scan_wms_layer')}</Button>
          <DrawActions cancel={disable} />
        </Modal.Title>
        <Modal.Body className='ap-modal-body scan-wms-modal-body'>
          <div className='m-2'>
            {showInfoMsg && (
              <p className='mb-2' style={{ fontSize: 'larger' }}>
                Select a source layer from the list below and click on the map to get info about it, if it exists
              </p>
            )}
            <form className='mt-3' onSubmit={onSubmit} onChange={onChange}>
              <div className='form-group'>
                <label htmlFor='sourceName'>{getLabel('select_source_layer')}</label>
                <select name='sourceName' id='sourceName' className='form-control' required value={sourceName}>
                  <option value='' />
                  {Object.keys(systemLayers).map((systemLayer, i) => (
                    <option key={systemLayer} id={systemLayer} value={systemLayer}>{Object.values(systemLayers)[i]}</option>
                  ))}
                </select>
              </div>
              {loading && <Spinner animation='border' variant='secondary' />}
              {sourceName && sourceLayer && (
                <div>
                  <p>{getLabel('selected_layer')}</p>
                  <div className='import-layer-main-container'>
                    <div className='border import-layer-container'>
                      {Object.entries(sourceLayer).map(([key, value], i, properties) => {
                        return (
                          <div key={sourceLayer.object_id} className='import-layer-item'>
                            <span className={`mb-1 import-layer-span ${i === properties.length - 1 && 'import-layer-last-element'}`}>
                              <div className='import-layer-key ml-1'>{key}</div> <div className='import-layer-border'></div>
                              <div className='ml-1 import-layer-value'>{value}</div>
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
              {sourceLayer && (
                <React.Fragment>
                  <div className='form-group mt-3'>
                    <label htmlFor='externalLayerCode'>{getLabel('external_layer')}</label>
                    <select name='externalLayerCode' id='externalLayerCode' className='form-control' required value={externalLayerCode}>
                      <option value='' />
                      {externalLayers.map((externalLayer) => {
                        const externalLayerId = externalLayer['GEO_LAYER_TYPE.OBJECT_ID']
                        const externalLayerTitle = externalLayer['GEO_LAYER_TYPE.TITLE']
                        return (
                          <option key={externalLayerId} id={externalLayerTitle} value={externalLayerTitle}>{externalLayerTitle}</option>
                        )
                      })}
                    </select>
                  </div>
                  <div className='form-group'>
                    <label htmlFor='targetLayer'>{getLabel('select_target_layer')}</label>
                    <select name='targetLayer' id='targetLayer' className='form-control' required value={targetLayer}>
                      <option value='' />
                      {Object.keys(systemLayers).map((systemLayer, i) => (
                        <option key={systemLayer} id={systemLayer} value={systemLayer}>{Object.values(systemLayers)[i]}</option>
                      ))}
                    </select>
                  </div>
                  <Button type='submit' className='next' size=''>{getLabel('save')}</Button>
                </React.Fragment>
              )}
            </form>
          </div>
        </Modal.Body>
      </Modal>
    )
  }

  const renderComponent = () => {
    let componentToRender = null

    if (showForm) {
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
        title={getLabel('scan_wms')}>
        <Icon name={_id} size='36px' />
        <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('scan_wms')}</span>
      </ProcessButton>
      {processID === _id && renderComponent()}
    </div>
  );
}

export const ScanWMS = core.connect(state => ({
  processID: state.app.processID,
  systemLayers: state.lpis?.systemLayers,
  farmObjId: state.farmRegistry?.farmObjId,
}))(_ScanWMS)
