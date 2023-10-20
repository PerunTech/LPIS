import { React } from 'perun-core';
import { core, ui } from '../../../Spatial';
import { ProcessButton } from '../..';
import { getLabel, strcmp } from '../../Util';

const { Map } = core;
const { Icon } = ui;

export const Erase = () => {
  const eraseIoLayers = () => {
    Map.eachLayer(function (layer) {
      if (!!layer.toGeoJSON) {
        if (strcmp(layer.DESCRIPTOR, 'IO_LAYER')) {
          layer.removeFrom(Map)
        }
      }
    });
  }

  return (
    <ProcessButton id='erase_io' onClick={eraseIoLayers}>
      <Icon name='erase' size='30px' />
      <span style={{ display: "block", marginTop: '5px' }}>{getLabel('remove')}</span>
    </ProcessButton>
  )
}
