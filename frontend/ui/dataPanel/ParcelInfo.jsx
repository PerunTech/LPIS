import { React, elements } from 'perun-core'
import { core, ui } from '../../Spatial'

const { store, connect } = core
const { Button, Icon } = ui
const { alertUser } = elements

const _ParcelInfo = ({ farmInfo, parcelInfo, showParcelInfoContainer }) => {
  const toggleParcelInfoContainer = () => {
    if (!farmInfo && !parcelInfo) {
      alertUser(true, 'info', 'Нема избрана парцела за која може да се прикажат информации')
    } else {
      store.dispatch({ showParcelInfoContainer: !showParcelInfoContainer })
    }
  }

  const getIconName = () => {
    let iconName = 'docs'
    if (!showParcelInfoContainer) {
      iconName = 'info'
    }
    return iconName
  }

  return (
    <React.Fragment>
      <Button
        variant='dark'
        className='d-flex flex-row justify-content-center align-items-center mt-1 rounded data-panel-btn'
        onClick={toggleParcelInfoContainer}
      >
        <Icon name={getIconName()} size='20px' />
        <span style={{ margin: '3px 3px 0 3px' }}>{!showParcelInfoContainer ? 'Информации за парцела' : 'Листа на парцели'}</span>
      </Button>
    </React.Fragment>
  )
}

export const ParcelInfo = connect(state => ({
  showParcelInfoContainer: state.farmRegistry?.showParcelInfoContainer, farmInfo: state.farmRegistry?.farmInfo, parcelInfo: state.farmRegistry?.parcelInfo,
}))(_ParcelInfo)
