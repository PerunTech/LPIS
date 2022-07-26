import { React, elements } from 'perun-core'
import { core, ui } from '../../Spatial'
import { translateLandCoverCode } from '../Util'

const { store, connect } = core
const { Modal, Button, DrawActions } = ui
const { useEffect } = React
const { ReactBootstrap } = elements
const { Table } = ReactBootstrap

const _ParcelHistory = ({ parcelHistory, setShowParcelHistory }) => {
  useEffect(() => {
    return () => {
      store.dispatch({ parcelHistory: [] })
    }
  }, [])

  const disable = () => {
    store.dispatch({ parcelHistory: [] })
    setShowParcelHistory(false)
  }

  const renderTable = () => {
    const headingsArr = ['Датум', 'СИЗП број', 'Површина', 'Употреба на земјиште', 'Место викано', 'Заедничка употреба', 'Право на користење', 'Вкупна површина']

    return (
      <Table striped bordered>
        <thead>
          {headingsArr.map(heading => <th>{heading}</th>)}
        </thead>
        <tbody>
          {parcelHistory.map((historyEl) => {
            const translatedLandCoverCode = translateLandCoverCode(historyEl['AGRI_PARCEL.LAND_COVER_CODE'])
            return (
              <tr>
                <td>{historyEl.formattedDate}</td>
                <td>{historyEl['AGRI_PARCEL.OLD_ID']}</td>
                <td>{`${Math.round(Number(historyEl['AGRI_PARCEL.ALLOWED_AREA'] || historyEl['AGRI_PARCEL.AREA']))} m²`}</td>
                <td>{translatedLandCoverCode}</td>
                <td>{historyEl['AGRI_PARCEL.HOME_NAME'] || 'Не е наведено'}</td>
                <td>{historyEl['AGRI_PARCEL.COMMON_USE']}</td>
                <td>{historyEl['AGRI_PARCEL.CERTIFICATE_OF_USE']}</td>
                <td>{Math.round(historyEl['AGRI_PARCEL.AREA'])} m²</td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    )
  }

  const renderModal = () => {
    const modalProps = {
      show: true,
      backdrop: false,
      enforceFocus: false,
      id: 'measure-dialog',
      className: 'parcel-history-info-modal',
      container: document.getElementsByClassName('control-map')[0]
    }

    return <Modal {...modalProps}>
      <Modal.Title>
        <Button disabled className='as-label ap-modal-title' >Историја на парцела</Button>
        <DrawActions cancel={disable} />
      </Modal.Title>
      <Modal.Body className='parcel-history-info-modal-body'>
        {renderTable()}
      </Modal.Body>
    </Modal>
  }

  return (
    <React.Fragment>
      {renderModal()}
    </React.Fragment>
  )
}

export const ParcelHistory = connect(state =>
  ({ parcelHistory: state.farmRegistry?.parcelHistory }))(_ParcelHistory)
