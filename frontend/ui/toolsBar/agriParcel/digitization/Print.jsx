import { React, Loading, redux } from 'perun-core'
import { core, ui } from '../../../../Spatial'
import { downloadFile, getLabel } from '../../../Util'
import { ProcessButton } from '../../ProcessButton'

const { store, connect, http } = core
const { Icon, DrawActions, Modal, Button } = ui
const { useReducer } = React
const _id = 'print'
const _iconId = 'pdf'

const _Print = ({ processID, farmObjId }) => {
  const [{ isEnabled, loading }, setState] = useReducer((currState, update) => ({ ...currState, ...update }), { isEnabled: false, loading: false });

  const enable = () => {
    setState({ isEnabled: true, loading: false })
    store.dispatch({ processID: _id })
  }

  const disable = () => {
    setState({ isEnabled: false, loading: false })
    store.dispatch({ processID: '' })
  }

  const print = reportName => {
    setState({ loading: true })
    const _token = redux.store.getState().security.svSession
    const wsPath = `lpis/Generate/report/sessionId/${_token}/objectId/${farmObjId}/reportName/${reportName}/fileType/PDF`
    const url = `${window.server}/${wsPath}`
    const reqConfig = { method: 'get', url, responseType: 'blob' }
    http.call('printLpisReport', reqConfig).then(res => {
      downloadFile(res, reportName, disable)
    }).catch(err => {
      console.error(err)
      disable()
    })
  }

  const renderComponent = () => {
    let componentToRender = null

    if (isEnabled) {
      const modalProps = {
        show: true,
        backdrop: false,
        enforceFocus: false,
        id: 'measure-dialog',
        container: document.getElementsByClassName('control-map')[0]
      }

      componentToRender = <Modal {...modalProps}>
        <Modal.Title>
          <Button disabled className='as-label ap-modal-title' >{getLabel('reports')}</Button>
          <DrawActions cancel={disable} />
        </Modal.Title>
        <Modal.Body className='ap-modal-body' >
          <div className='p-1'>
            <Button block variant='dark' onClick={() => print('parcels_changes')}>
              {getLabel('parcels_changes')}
            </Button>
            <Button block variant='dark' onClick={() => print('parcels_identification')}>
              {getLabel('parcels_identification')}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    }

    return componentToRender
  }

  return (
    <ProcessButton id={_id} onClick={enable} >
      <Icon name={_iconId} size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('reports')}</span>
      {processID === _id && renderComponent()}
      {loading && <Loading />}
    </ProcessButton>
  );
}

export const Print = connect(state => ({
  processID: state.app.processID, farmObjId: state.farmRegistry?.farmObjId
}))(_Print)
