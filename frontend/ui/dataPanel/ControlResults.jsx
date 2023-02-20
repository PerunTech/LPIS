import { React, elements } from 'perun-core'
import { core, ui } from '../../Spatial'

const { store, connect } = core
const { Button, Icon } = ui
const { alertUser } = elements

const _ControlResults = ({ controlResults, showControlResultsContainer }) => {
  const toggleControlResultsContainer = () => {
    if (controlResults.length > 0) {
      store.dispatch({ showControlResultsContainer: !showControlResultsContainer, showParcelInfoContainer: false })
    } else {
      alertUser(true, 'info', 'Не се пронајдени резултати од контрола')
    }
  }

  const getIconName = () => {
    let iconName = 'docs-secondary'
    if (!showControlResultsContainer) {
      iconName = 'info'
    }
    return iconName
  }

  return (
    <React.Fragment>
      <Button
        variant='dark'
        size='normal'
        style={{
          fontSize: '14px',
          width: '210px',
        }}
        onClick={toggleControlResultsContainer}
      >
        <Icon name={getIconName()} size='20px' />
        <span style={{ margin: '3px 3px 0 3px' }}>{!showControlResultsContainer ? 'Резултати од контрола' : 'Листа на парцели'}</span>
      </Button>
    </React.Fragment>
  )
}

export const ControlResults = connect(state => ({
  controlResults: state.farmRegistry?.controlResults,
  showControlResultsContainer: state.farmRegistry?.showControlResultsContainer,
}))(_ControlResults)
