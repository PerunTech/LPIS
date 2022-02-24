import { React, elements } from 'perun-core';
import { ui } from '../../../../Spatial';
import { ProcessButton } from '../../ProcessButton';
import { getFarmMapAssets } from '../../../Util';

const { alertUser } = elements;
const { Icon } = ui;
const _id = 'refresh'

export const Refresh = () => {
  const onClick = () => {
    getFarmMapAssets()
    alertUser(true, 'success', 'Податоците се успешно освежени.')
  }

  return <ProcessButton onClick={onClick} title='Освежи податоци'>
    <Icon name={_id} size='30px' />
    <span style={{ display: 'block', marginTop: '5px' }}>Освежи податоци</span>
  </ProcessButton>
}
