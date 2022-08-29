import { React } from 'perun-core';
import { core, ui } from '../../../Spatial';

const { connect } = core;
const { Button, Icon } = ui

const _EditLine = () => {
  return (
    <Button disabled >
      <Icon name='createBlock' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>Уреди линија</span>
    </Button>
  )
}

export const EditLine = connect(state => ({
  processID: state.app.processID
}))(_EditLine)
