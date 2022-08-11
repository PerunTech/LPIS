import { React } from 'perun-core';
import { ui } from '../../../../Spatial';
import { ProcessButton } from '../../ProcessButton';
import { getFarmMapAssets } from '../../../Util';
import { removeCadParcels, removeSearchedParcels } from '../../../dataPanel/Util';

const { Icon } = ui;
const _id = 'refresh'

export const Refresh = () => {
  const onClick = () => {
    getFarmMapAssets(false, true)
    removeCadParcels()
    removeSearchedParcels()
  }

  return <ProcessButton onClick={onClick} title='Освежи податоци'>
    <Icon name={_id} size='30px' />
    <span style={{ display: 'block', marginTop: '5px' }}>Освежи</span>
  </ProcessButton>
}
