import { React } from 'perun-core';
import { core, ui } from '../../../Spatial';

const { connect } = core;
const { Button, Icon } = ui

const _Point = () => {
  return (
    <Button disabled >
      <Icon name='selection' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>Точка</span>
    </Button>
  )
}

export const Point = connect(state => ({
  processID: state.app.processID
}))(_Point)
