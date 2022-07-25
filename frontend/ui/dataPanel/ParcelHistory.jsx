import { React, elements } from 'perun-core'
import { core, ui } from '../../Spatial'
import { translateBooleanValue, translateLandCoverCode } from '../Util'

const { store, connect } = core
const { Modal, Button, DrawActions } = ui
const { useEffect } = React
const { ReactBootstrap } = elements
const { ListGroup, ProgressBar } = ReactBootstrap
const { Item: ListGroupItem } = ListGroup

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

  const renderParcelHistoryList = (parcelHistory, index) => {
    const translatedLandCoverCode = translateLandCoverCode(parcelHistory['AGRI_PARCEL.LAND_COVER_CODE'])
    return (
      <React.Fragment>
        <div style={{ marginTop: index > 0 ? '8rem' : '0' }}>
          {index > 0 && <hr />}
          <h5 className='text-center' >Состојба на {parcelHistory.formattedDate}</h5>
        </div>
        <ListGroup className='text-center mb-2' style={{ height: '650px' }}>
          <ListGroupItem className='p-2'>
            СИЗП број: <span className='font-weight-bold'>{parcelHistory['AGRI_PARCEL.OLD_ID']}</span>
          </ListGroupItem>
          <ListGroupItem className='p-2'>
            Површина: <span className='font-weight-bold'>{`${Math.round(Number(parcelHistory['AGRI_PARCEL.ALLOWED_AREA'] || parcelHistory['AGRI_PARCEL.AREA']))} m²`}</span>
          </ListGroupItem>
          <ListGroupItem className='p-2'>
            Употреба на земјиште: <span className='font-weight-bold'>{translatedLandCoverCode}</span>
          </ListGroupItem>
          <ListGroupItem className='p-2'>
            Заедничка употреба: <span className='font-weight-bold'>{translateBooleanValue(parcelHistory['AGRI_PARCEL.COMMON_USE'])}</span>
          </ListGroupItem>
          <ListGroupItem className='p-2'>
            Право на користење: <span className='font-weight-bold'>{translateBooleanValue(parcelHistory['AGRI_PARCEL.CERTIFICATE_OF_USE'])}</span>
          </ListGroupItem>
          <ListGroupItem className='p-2'>
            Вкупна површина: <span className='font-weight-bold'>{Math.round(parcelHistory['AGRI_PARCEL.AREA'])} m²</span>
          </ListGroupItem>
          <ListGroupItem className='p-2'>
            Место викано: <span className='font-weight-bold'>{parcelHistory['AGRI_PARCEL.HOME_NAME'] || 'Не е наведено'}</span>
          </ListGroupItem>
          <ListGroupItem className='p-2'>
            Преклоп: <span className='font-weight-bold'>{translateBooleanValue(parcelHistory['AGRI_PARCEL.HAS_OVERLAP'])}</span>
          </ListGroupItem>
          <ListGroupItem className='p-2'>
            Тераси: <span className='font-weight-bold'>{translateBooleanValue(parcelHistory['AGRI_PARCEL.TERRACE'])}</span>
          </ListGroupItem>
          <ListGroupItem className='p-2'>
            Наводнување: <span className='font-weight-bold'>{translateBooleanValue(parcelHistory['AGRI_PARCEL.IRRIGATION'])}</span>
          </ListGroupItem>
          <ListGroupItem className='p-2'>
            Пејсажни карактеристики: <span className='font-weight-bold'>{translateBooleanValue(parcelHistory['AGRI_PARCEL.LANDSCAPE_FEATURES'])}</span>
          </ListGroupItem>
          <ListGroupItem className='p-2'>
            Невидлива граница: <span className='font-weight-bold'>{translateBooleanValue(parcelHistory['AGRI_PARCEL.INVISIBLE_BORDER'])}</span>
          </ListGroupItem>
          <ListGroupItem className='p-2'>
            Променета граница: <span className='font-weight-bold'>{translateBooleanValue(parcelHistory['AGRI_PARCEL.CHANGED_BORDER'])}</span>
          </ListGroupItem>
          <ListGroupItem className='p-2'>
            Експозиција: <span className='font-weight-bold'>{parcelHistory['AGRI_PARCEL.EXPOSITION_AVG']}</span>
          </ListGroupItem>
          <ListGroupItem className='p-2'>
            Наклон: <span className='font-weight-bold'>{parcelHistory['AGRI_PARCEL.SLOPE_AVG']}</span>
          </ListGroupItem>
          <ListGroupItem className='p-2'>
            Надморска височина: <span className='font-weight-bold'>{Math.round(parcelHistory['AGRI_PARCEL.Z_AVG'])} m</span>
          </ListGroupItem>
          <ListGroupItem className='p-2'>
            Коефициент на искористена површина:
            <ProgressBar now={parcelHistory['AGRI_PARCEL.ELIGIBILITY_COEF']} label={`${parcelHistory['AGRI_PARCEL.ELIGIBILITY_COEF']}%`} />
          </ListGroupItem>
          <ListGroupItem className='p-2'>
            Органско производство: <span className='font-weight-bold'>{translateBooleanValue(parcelHistory['AGRI_PARCEL.ORGANIC'])}</span>
          </ListGroupItem>
          <ListGroupItem className='p-2'>
            Тип на почва: <span className='font-weight-bold'>{parcelHistory['AGRI_PARCEL.SOIL_TYPE'] || 'Не е наведено'}</span>
          </ListGroupItem>
        </ListGroup>
      </React.Fragment>
    )
  }

  const renderModal = () => {
    const modalProps = {
      show: true,
      backdrop: false,
      enforceFocus: false,
      id: 'measure-dialog',
      className: 'parcel-info-modal',
      container: document.getElementsByClassName('control-map')[0]
    }

    return <Modal {...modalProps}>
      <Modal.Title>
        <Button disabled className='as-label ap-modal-title' >Историја на парцела</Button>
        <DrawActions cancel={disable} />
      </Modal.Title>
      <Modal.Body className='parcel-info-modal-body'>
        {parcelHistory.map((historyEl, i) => {
          return renderParcelHistoryList(historyEl, i)
        })}
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
