import { React, redux } from 'perun-core'
import { core, ui } from '../../../../Spatial'
import { ProcessButton } from '../../ProcessButton'

const { store } = core
const { Icon, DrawActions, Modal, Button } = ui
const { useReducer } = React
const _id = 'print'
const _iconId = 'pdf'

const _Print = ({ processID, farmObjId }) => {
  const [{ isEnabled }, setState] = useReducer((currState, update) => ({ ...currState, ...update }), { isEnabled: false });

  const enable = () => {
    setState({ isEnabled: true })
    store.dispatch({ processID: _id })
  }

  const disable = () => {
    setState({ isEnabled: false })
    store.dispatch({ processID: '' })
  }

  const print = reportName => {
    const _token = redux.store.getState().security.svSession
    const wsPath = `lpis/Generate/report/sessionId/${_token}/objectId/${farmObjId}/reportName/${reportName}/fileType/PDF`
    const url = `${window.server}/${wsPath}`
    disable()
    window.open(url, '_blank')
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
          <Button disabled className='as-label ap-modal-title' >Извештаи</Button>
          <DrawActions cancel={disable} />
        </Modal.Title>
        <Modal.Body className='ap-modal-body' >
          <div className='p-1'>
            <Button block variant='dark' onClick={() => print('parcels_changes')}>
              Извршена промена на земјишните парцели по службена должност
            </Button>
            <Button block variant='dark' onClick={() => print('parcels_identification')}>
              Идентификација на земјишни парцели
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    }

    return componentToRender
  }

  return <ProcessButton id={_id} onClick={enable} >
    <Icon name={_iconId} size='30px' />
    <span style={{ display: 'block', marginTop: '5px' }}>Извештаи</span>
    {processID === _id && renderComponent()}
  </ProcessButton>;
}

export const Print = core.connect(state => ({
  processID: state.app.processID, farmObjId: state.farmRegistry?.farmObjId
}))(_Print)
