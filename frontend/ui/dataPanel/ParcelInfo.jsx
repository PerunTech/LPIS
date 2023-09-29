import { React } from 'perun-core'
import { core, ui } from '../../Spatial'
import { getLabel } from '../Util'

const { store, connect } = core
const { Button, Icon } = ui

const _ParcelInfo = ({ farmInfo, parcelInfo, showParcelInfoContainer }) => {
  const toggleParcelInfoContainer = () => {
    if (!farmInfo && !parcelInfo) {
      store.dispatch({ activateInfoProcess: true })
    } else {
      store.dispatch({ showParcelInfoContainer: !showParcelInfoContainer, showControlResultsContainer: false })
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
        <span style={{ margin: '3px 3px 0 3px' }}>{!showParcelInfoContainer ? `${getLabel('parcel_info')}` : `${getLabel('parcel_list')}`}</span>
      </Button>
    </React.Fragment>
  )
}

export const ParcelInfo = connect(state => ({
  showParcelInfoContainer: state.farmRegistry?.showParcelInfoContainer, farmInfo: state.farmRegistry?.farmInfo, parcelInfo: state.farmRegistry?.parcelInfo,
}))(_ParcelInfo)
