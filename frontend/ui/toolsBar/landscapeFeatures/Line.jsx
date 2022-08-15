import { React } from 'perun-core';
import { core, ui } from '../../../Spatial';

const { connect } = core;
const { Button, Icon } = ui

const _Line = () => {
  return (
    <Button disabled >
      <Icon name='length' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>Линија</span>
    </Button>
  )
}

export const Line = connect(state => ({
  processID: state.app.processID
}))(_Line)
