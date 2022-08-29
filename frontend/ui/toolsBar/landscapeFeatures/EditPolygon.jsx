import { React } from 'perun-core';
import { core, ui } from '../../../Spatial';

const { connect } = core;
const { Button, Icon } = ui

const _EditPolygon = () => {
  return (
    <Button disabled >
      <Icon name='selection-frame' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>Уреди полигон</span>
    </Button>
  )
}

export const EditPolygon = connect(state => ({
  processID: state.app.processID
}))(_EditPolygon)
