import { React } from 'perun-core';
import { core, ui } from '../../../Spatial';
import { getLabel } from '../../Util';

const { connect } = core;
const { Button, Icon } = ui

const _EditLine = () => {
  return (
    <Button disabled >
      <Icon name='createBlock' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('edit_line')}</span>
    </Button>
  )
}

export const EditLine = connect(state => ({
  processID: state.app.processID
}))(_EditLine)
