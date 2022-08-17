import { React, elements } from 'perun-core'
import { core, ui } from '../../Spatial'
import { strcmp, translateBooleanValue, translateLandCoverCode } from '../Util'
import { truncate } from './Util'

const { Map, store, connect } = core
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
    removeParcelHistoryLayers()
    store.dispatch({ parcelHistory: [] })
    setShowParcelHistory(false)
  }

  const removeParcelHistoryLayers = () => {
    Map.eachLayer(function (layer) {
      if (!!layer.toGeoJSON) {
        if (layer?.feature?.properties?.DESCRIPTOR && strcmp(layer?.feature?.properties?.DESCRIPTOR, 'PARCEL_HISTORY')) {
          Map.removeLayer(layer);
        }
      }
    });
  }

  const showGeometry = layer => {
    removeParcelHistoryLayers()
    layer.feature.properties.DESCRIPTOR = 'PARCEL_HISTORY'
    layer.addTo(Map)
  }

  const renderTable = () => {
    const headingsArr = [
      'Корис. име', 'Подрач. един.', 'СИЗП број', 'Површина', 'Употреба на земјиште',
      'Место викано', 'Заедничка употреба', 'Право на користење', 'Вкупна површина', 'Геометрија'
    ]

    return (
      <Table striped bordered>
        <thead>
          {headingsArr.map(heading => <th>{heading}</th>)}
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
            return (
              <tr key={parcelId}>
                <td title={userName || '/'}>{finalUserName}</td>
                <td>{properties.ORG_UNIT_NAME || '/'}</td>
                <td>{properties.OLD_ID}</td>
                <td>{`${Math.round(Number(properties.ALLOWED_AREA || properties.AREA))} m²`}</td>
                <td>{translatedLandCoverCode}</td>
                <td>{properties.HOME_NAME || 'Не е наведено'}</td>
                <td>{translateBooleanValue(properties.COMMON_USE)}</td>
                <td>{translateBooleanValue(properties.CERTIFICATE_OF_USE)}</td>
                <td>{Math.round(properties.AREA)} m²</td>
                <td>
                  <Button onClick={() => showGeometry(historyEl)}>
                    Прикажи геометрија
                  </Button>
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
