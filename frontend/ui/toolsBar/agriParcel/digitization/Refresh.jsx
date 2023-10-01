import { React } from 'perun-core';
import { core, ui } from '../../../../Spatial';
import { ProcessButton } from '../../ProcessButton';
import { getFarmMapAssets, getLabel } from '../../../Util';
import { removeCadParcels, removeSearchedParcels } from '../../../dataPanel/Util';

const { store } = core;
const { Icon } = ui;
const _id = 'refresh'

export const Refresh = () => {
  const onClick = () => {
    getFarmMapAssets(false, true)
    removeCadParcels()
    removeSearchedParcels()
    store.dispatch({ theSearchedParcelWasRemoved: true })
  }

  return <ProcessButton onClick={onClick} title={getLabel('refresh_data')}>
    <Icon name={_id} size='30px' />
    <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('refresh')}</span>
  </ProcessButton>
}
