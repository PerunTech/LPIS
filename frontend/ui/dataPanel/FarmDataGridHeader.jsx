import { React } from 'perun-core'
import { ui } from '../../Spatial';

const { ButtonGroup, Button } = ui;

export const FarmDataGridHeader = ({ gridType }) => {
  const colEnum = {
    agri_parcel: ['СИЗП Број', 'Класа', 'Површина', 'Место викано', 'Заедничка употр.', 'Право на корист.', '']
  };

  const generateHeader = () => {
    const type = gridType || 'agri_parcel'
    console.log(type)
    const columns = colEnum[type];
    return (
      <ButtonGroup className='fr-data-grid-header' id='grid-header'>
        {columns.map((c, i) => <Button key={i} disabled className='fr-data-grid-column'>{c}</Button>)}
      </ButtonGroup>
    );
  };

  return generateHeader()
}
