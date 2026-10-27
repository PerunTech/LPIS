import { React, elements } from 'perun-core'
import format from 'date-fns/format'
import mk from 'date-fns/locale/mk'
import { core, ui, config as cfg } from '../../Spatial'
import { getLabel, getMeasurementUnit, translateBooleanValue, translateLandCoverCode } from '../Util'
import { removeParcelHistoryLayers, truncate } from './Util'

const { MAP_CONFIG } = cfg
const { Map, store, connect } = core
const { Modal, Button, DrawActions } = ui
const { useEffect } = React
const { ReactBootstrap } = elements
const { Table } = ReactBootstrap

const _ParcelHistory = ({ parcelHistory, setShowParcelHistory, historyEditEnabled, editFormWasClosed }) => {
  useEffect(() => {
    return () => {
      store.dispatch({ parcelHistory: [], minZoom: MAP_CONFIG.minZoom, historyEditEnabled: false, historyParcelToEdit: {} })
    }
  }, [])

  useEffect(() => {
    if (editFormWasClosed) {
      store.dispatch({ minZoom: MAP_CONFIG.minZoom, historyEditEnabled: false, historyParcelToEdit: {}, editFormWasClosed: false })
    }
  }, [editFormWasClosed])

  const disable = () => {
    removeParcelHistoryLayers()
    store.dispatch({ parcelHistory: [], minZoom: MAP_CONFIG.minZoom, historyEditEnabled: false, historyParcelToEdit: {}, parcelHistoryModalWasClosed: true })
    setShowParcelHistory(false)
  }

  const showGeometry = (layer, isEdit) => {
    removeParcelHistoryLayers()
    layer.feature.properties.DESCRIPTOR = 'PARCEL_HISTORY'
    layer.addTo(Map)
    Map.fitBounds(layer.getBounds())
    if (isEdit) {
      store.dispatch({ historyEditEnabled: true, historyParcelToEdit: layer })
    }
  }

  const renderTable = () => {
    const headingsArr = [
      'Датум', 'Корис. име', 'Подрач. един.', 'СИЗП број', 'Површина', 'Употреба на земјиште',
      'Место викано', 'Заедничка употреба', 'Право на користење', 'Вкупна површина', 'Геометрија'
    ]

    return (
      <Table striped bordered>
        <thead>
          {headingsArr.map(heading => <th key={heading}>{heading}</th>)}
        </thead>
        <tbody>
          {parcelHistory.map((historyEl, i) => {
            const properties = historyEl.feature.properties
            const parcelId = `${properties.id}_${i + 1}`
            const translatedLandCoverCode = translateLandCoverCode(properties.LAND_COVER_CODE)
            let finalUserName = '/'
            const userName = properties.USER_NAME
            if (userName && (typeof userName === 'string' || userName instanceof String)) {
              finalUserName = truncate(userName, 20, true)
            }
            let finalDate = '/'
            const dateOfInsert = properties.DT_INSERT
            if (dateOfInsert) {
              const date = new Date(dateOfInsert)
              finalDate = format(date, 'do MMMM yyyy', { locale: mk })
            }
            return (
              <tr key={parcelId}>
                <td title={finalDate}>{finalDate}</td>
                <td title={userName || '/'}>{finalUserName}</td>
                <td>{properties.ORG_UNIT_NAME || '/'}</td>
                <td>{properties.OLD_ID}</td>
                <td>{`${Math.round(Number(properties.ALLOWED_AREA || properties.AREA))} ${getMeasurementUnit(true)}`}</td>
                <td>{translatedLandCoverCode}</td>
                <td>{properties.HOME_NAME || 'N/A'}</td>
                <td>{translateBooleanValue(properties.COMMON_USE)}</td>
                <td>{translateBooleanValue(properties.CERTIFICATE_OF_USE)}</td>
                <td>{Math.round(properties.AREA)} {getMeasurementUnit(true)}</td>
                <td>
                  <Button disabled={historyEditEnabled} onClick={() => showGeometry(historyEl)}>{getLabel('show_geom')}</Button>
                </td>
                <td>
                  <Button disabled={historyEditEnabled} onClick={() => showGeometry(historyEl, true)}>{getLabel('edit_geom')}</Button>
                </td>
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
      scrollable: true,
      enforceFocus: false,
      id: 'measure-dialog',
      className: 'parcel-history-info-modal',
      container: document.getElementsByClassName('control-map')[0]
    }

    return <Modal {...modalProps}>
      <Modal.Title>
        <Button disabled className='as-label ap-modal-title' >{getLabel('parcel_history')}</Button>
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

export const ParcelHistory = connect(state => ({
  parcelHistory: state.farmRegistry?.parcelHistory,
  historyEditEnabled: state.farmRegistry?.historyEditEnabled,
  editFormWasClosed: state.farmRegistry?.editFormWasClosed,
}))(_ParcelHistory)
