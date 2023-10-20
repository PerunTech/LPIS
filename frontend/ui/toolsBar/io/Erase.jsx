import { React } from 'perun-core';
import { ui } from '../../../Spatial';
import { ProcessButton } from '../..';
import { getLabel } from '../../Util';
import { eraseIoLayers } from './Util';

const { Icon } = ui;

export const Erase = () => {
  return (
    <ProcessButton id='erase_io' onClick={eraseIoLayers}>
      <Icon name='erase' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('remove')}</span>
    </ProcessButton>
  )
}
