import { React, elements } from 'perun-core'
import { core, ui } from '../../Spatial'
import { getFarmDigitizationState, getLabel, strcmp } from '../Util'

const { connect, http } = core
const { Button, Icon } = ui
const { alertUser } = elements

const _StartEndDigitization = ({ farmObjId, digitizationIsActive }) => {
  const setDigitizationState = () => {
    const url = `/WsConf/params/set/boolean/{init.token}/LPIS-DGTZ/${farmObjId}/${!digitizationIsActive}`
    http.call('setDigitizationState', { url }).then((res) => {
      const resType = res.data?.type?.toLowerCase() || 'info'
      let title = ''
      if (strcmp(resType, 'success')) {
        title = digitizationIsActive ? `${getLabel('end_digitization_success')}` : `${getLabel('start_digitization_success')}`
      }
      alertUser(true, resType, title)
      getFarmDigitizationState(farmObjId)
    }).catch((error) => {
      alertUser(true, 'error', error)
    })
  }

  const onClick = () => {
    let alertTitle = `${getLabel('end_digitization_confirmation')}`
    if (!digitizationIsActive) {
      alertTitle = `${getLabel('start_digitization_confirmation')}`
    }
    alertUser(true, 'warning', alertTitle, '', () => setDigitizationState(), () => { }, true, `${getLabel('yes')}`, `${getLabel('no')}`)
  }

  return (
    <Button
      variant='dark'
      size='normal'
      onClick={onClick}
      style={{
        fontSize: '14px',
        width: '200px',
        backgroundColor: digitizationIsActive ? '#850000' : '#174c20',
        borderColor: digitizationIsActive ? '#850000' : '#174c20'
      }}
      title={digitizationIsActive ? `${getLabel('digitization_started')}` : `${getLabel('digitization_ended')}`}
    >
      <Icon name={digitizationIsActive ? 'stop' : 'start'} size={digitizationIsActive ? '16px' : '19px'} />
      <span className='ml-2'>{digitizationIsActive ? `${getLabel('end_digitization')}` : `${getLabel('start_digitization')}`}</span>
    </Button>
  )
}

export const StartEndDigitization = connect(state => ({
  farmObjId: state.farmRegistry?.farmObjId,
  digitizationIsActive: state.farmRegistry?.digitizationIsActive,
}))(_StartEndDigitization)
