import { React } from 'perun-core';
import { ui } from '../../../Spatial';
import { ExportSHP } from './ExportSHP';
import { getLabel } from '../../Util';

const { ButtonGroup, Button, Icon, Divider } = ui;

export const Export = () =>
  <ButtonGroup id='io' >
    <ExportSHP />
    <Button disabled >
      <Icon name='geojson' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('export_geojson')}</span>
    </Button>
    <Button disabled >
      <Icon name='csv' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('export_csv')}</span>
    </Button>
    <Button disabled >
      <Icon name='xsl' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('export_xls')}</span>
    </Button>
    <Button disabled >
      <Icon name='pdf' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('export_pdf')}</span>
    </Button>
    <Button disabled >
      <Icon name='map-report' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('generate_cartography')}</span>
    </Button>
    <Divider />
    <Button disabled >
      <Icon name='printer' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('print')}</span>
    </Button>
  </ButtonGroup>;
