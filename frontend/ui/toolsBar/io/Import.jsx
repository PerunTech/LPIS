import { React } from 'perun-core';
import { ui } from '../../../Spatial';
import { getLabel } from '../../Util';
import { ImportSHP } from './ImportSHP';
import { ImportWMS } from './ImportWMS';
import { ScanWMS } from './ScanWMS';

const { ButtonGroup, Button, Icon } = ui;

export const Import = () =>
  <ButtonGroup id='io' >
    <ImportWMS />
    <ScanWMS />
    <ImportSHP />
    <Button disabled >
      <Icon name='geojson' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('import_geojson')}</span>
    </Button>
  </ButtonGroup>;
