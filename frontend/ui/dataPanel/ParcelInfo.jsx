import { React, elements } from 'perun-core'
import { core, ui } from '../../Spatial'

const { store, connect } = core
const { Button } = ui
const { alertUser } = elements

const _ParcelInfo = ({ farmInfo, parcelInfo, showParcelInfoContainer }) => {
  const toggleParcelInfoContainer = () => {
    if (!farmInfo && !parcelInfo) {
      alertUser(true, 'info', 'Нема избрана парцела за која може да се прикажат информации')
    } else {
      store.dispatch({ showParcelInfoContainer: !showParcelInfoContainer })
    }
  }

  return (
    <React.Fragment>
      <Button variant='dark' className='mt-1' onClick={toggleParcelInfoContainer}>
        {!showParcelInfoContainer ? 'Информации за парцела' : 'Листа на парцели'}
      </Button>
    </React.Fragment>
  )
}

export const ParcelInfo = connect(state => ({
  showParcelInfoContainer: state.farmRegistry?.showParcelInfoContainer, farmInfo: state.farmRegistry?.farmInfo, parcelInfo: state.farmRegistry?.parcelInfo,
}))(_ParcelInfo)
