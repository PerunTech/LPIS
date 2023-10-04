import { React } from 'perun-core';
import { core, ui } from '../../../Spatial';
import { getLabel } from '../../Util';

const { connect } = core;
const { Button, Icon } = ui

const _EditPoint = () => {
  return (
    <Button disabled >
      <Icon name='editBlock' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('edit_point')}</span>
    </Button>
  )
}

export const EditPoint = connect(state => ({
  processID: state.app.processID
}))(_EditPoint)
