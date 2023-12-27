import { React } from 'perun-core'
import { ui } from '../../Spatial';
import { getLabel } from '../Util';

const { ButtonGroup, Button } = ui;

export const FarmDataGridHeader = ({ gridType }) => {
  const colEnum = {
    agri_parcel: [
      '',
      `${getLabel('lpis_number')}`,
      `${getLabel('class')}`,
      `${getLabel('area')}`,
      `${getLabel('locality')}`,
      `${getLabel('common_use')}`,
      `${getLabel('right_of_use')}`,
      ''
    ]
  };

  const generateHeader = () => {
    const type = gridType || 'agri_parcel'
    const columns = colEnum[type];
    return (
      <ButtonGroup className='fr-data-grid-header' id='grid-header'>
        {columns.map((c, i) => {
          let className = 'fr-data-grid-column'
          if (i === 0) {
            className = 'fr-data-grid-column-index'
          }
          return <Button key={i} disabled className={className}>{c}</Button>
        })}
      </ButtonGroup>
    );
  };

  return generateHeader()
}
