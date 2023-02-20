import { React } from 'perun-core'
import { ui } from '../../Spatial';

const { ButtonGroup, Button } = ui;

export const ControlResultsDataGridHeader = () => {
  const colEnum = {
    control_results: ['', 'Статус', 'Класа', 'Култура', 'Вк. површ.', 'Површ. во парцела', 'Тол.', 'Садници', '']
  };

  const generateHeader = () => {
    const columns = colEnum['control_results'];
    return (
      <ButtonGroup className='fr-data-grid-header mt-2' id='grid-header'>
        {columns.map((c, i) => {
          let className = 'control-results-data-grid-column'
          if (i === 0) {
            className = 'control-results-data-grid-column-index'
          }
          return <Button key={i} disabled className={className}>{c}</Button>
        })}
      </ButtonGroup>
    );
  };

  return generateHeader()
}
