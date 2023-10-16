import { React } from 'perun-core';
import { ui } from '../../../Spatial';
import { getLabel } from '../../Util';
import { ImportSHP } from './ImportSHP';

const { ButtonGroup, Button, Icon } = ui;

export const Import = () =>
  <ButtonGroup id='io' >
    <ImportSHP />
    <Button disabled >
      <Icon name='geojson' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('import_geojson')}</span>
    </Button>
  </ButtonGroup>;
