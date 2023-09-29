import { React } from 'perun-core';
import { ui } from '../../../Spatial';
import { getLabel } from '../../Util';

const { ButtonGroup, Button, Icon } = ui;

export const Import = () =>
  <ButtonGroup id='io' >
    <Button disabled >
      <Icon name='shapefile' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('import_shapefile')}</span>
    </Button>
    <Button disabled >
      <Icon name='geojson' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('import_geojson')}</span>
    </Button>
  </ButtonGroup>;
