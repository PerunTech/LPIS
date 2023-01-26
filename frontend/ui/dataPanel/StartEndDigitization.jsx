import { React, elements } from 'perun-core'
import { core, ui } from '../../Spatial'
import { getFarmDigitizationState, strcmp } from '../Util'

const { connect, store, http } = core
const { Button } = ui
const { alertUser } = elements
const { useEffect } = React

const _StartEndDigitization = ({ farmObjId, digitizationIsActive }) => {
  useEffect(() => {
    return () => {
      store.dispatch({ canRenderTheDigitizationButton: false })
    }
  }, [])

  const setDigitizationState = () => {
    const url = `/WsConf/params/set/boolean/{init.token}/LPIS-DGTZ/${farmObjId}/${!digitizationIsActive}`
    http.call('setDigitizationState', { url }).then((res) => {
      const resType = res.data?.type?.toLowerCase() || 'info'
      const title = strcmp(resType, 'success') ? 'Успешно зачувување' : ''
      alertUser(true, resType, title)
      getFarmDigitizationState(farmObjId)
    }).catch((error) => {
      alertUser(true, 'error', error)
    })
  }

  const onClick = () => {
    let alertTitle = 'Дали сте сигурни дека сакате да завршите со дигитазација?'
    if (!digitizationIsActive) {
      alertTitle = 'Дали сте сигурни дека сакате да започнете со дигитазација?'
    }
    alertUser(true, 'warning', alertTitle, '', () => setDigitizationState(), () => { }, true, 'Да', 'Не')
  }

  return (
    <React.Fragment>
      <div className='d-flex flex-row justify-content-center align-items-center mt-1 mb-1'>
        <Button variant='dark' size='normal' onClick={onClick}>
          {digitizationIsActive ? 'Заврши дигитизација' : 'Започни дигитизација'}
        </Button>
      </div>
    </React.Fragment>
  )
}

export const StartEndDigitization = connect(state => ({
  farmObjId: state.farmRegistry?.farmObjId,
  digitizationIsActive: state.farmRegistry?.digitizationIsActive,
}))(_StartEndDigitization)
