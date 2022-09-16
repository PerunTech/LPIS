import { React } from 'perun-core';
import { ui } from '../../../Spatial';

const { ButtonGroup, Button, Icon } = ui;

export const Import = () =>
  <ButtonGroup id='io' >
    <Button disabled >
      <Icon name='shapefile' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>Увези SHP</span>
    </Button>
    <Button disabled >
      <Icon name='geojson' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>Увези GeoJSON</span>
    </Button>
  </ButtonGroup>;
