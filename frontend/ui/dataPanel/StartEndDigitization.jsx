import { React, elements } from 'perun-core'
import { core, ui } from '../../Spatial'

const { connect } = core
const { Button } = ui
const { alertUser } = elements
const { useReducer } = React

const _StartEndDigitization = () => {
  const [{ isStarted }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }), { isStarted: false });

  const onClick = () => {
    if (!isStarted) {
      const title = 'Дали сте сигурни дека сакате да започнете со дигитазација?'
      alertUser(true, 'warning', title, '', () => { }, () => { }, true, 'Да', 'Не')
    }
  }

  return (
    <React.Fragment>
      <div className='d-flex flex-row justify-content-center align-items-center mt-1 mb-1'>
        <Button variant='dark' size='normal' onClick={onClick}>
          Започни/Заврши дигитизација
        </Button>
      </div>
    </React.Fragment>
  )
}

export const StartEndDigitization = connect(state => ({
  actionType: state.farmRegistry?.actionType
}))(_StartEndDigitization)
