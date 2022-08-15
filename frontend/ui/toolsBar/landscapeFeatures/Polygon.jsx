import { React } from 'perun-core';
import { core, ui } from '../../../Spatial';

const { connect } = core;
const { Button, Icon } = ui

const _Polygon = () => {
  return (
    <Button disabled >
      <Icon name='selection-polygon' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>Полигон</span>
    </Button>
  )
}

export const Polygon = connect(state => ({
  processID: state.app.processID
}))(_Polygon)
