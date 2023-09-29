import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../Spatial';
import { DataList } from '..';
import { FarmDataGridInfoHeader } from './FarmDataGridInfoHeader';
import { FarmDataGridNumOfParcels } from './FarmDataGridNumOfParcels';
import { FarmDataGridHeader } from './FarmDataGridHeader';
import { StartEndDigitization } from './StartEndDigitization';
import { CadastreSearch } from './CadastreSearch';
import { LpisSearch } from './LpisSearch';
import { ParcelInfo } from './ParcelInfo';
import { ControlResults } from './ControlResults';
import { ControlResultsDataGridHeader } from './ControlResultsDataGridHeader';
import { getLabel, strcmp } from '../Util';

const { Button, Icon } = ui;
const { store, connect } = core;
const { useState, useEffect } = React;

/* Root nodes in the data panel tree. */
const dataCategories = (function () {
  return Object.entries({
    physical_block: `${getLabel('physical_blocks')}`,
  }).map(entry => ({ id: entry[0], label: entry[1], isOpen: true, }))
})();

/**
 * 
 * @param {*} props 
 */
const _DataPanel = ({
  categories, farmData, actionType, showParcelInfoContainer, showControlResultsContainer, canRenderTheDigitizationButton, controlResults
}) => {
  const [data, setData] = useState(categories);
  const [isOpen, setOpen] = useState(true);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(0);
  const [controlResultsArr, setControlResultsArr] = useState([]);

  useEffect(() => {
    getYears()

    return () => {
      store.dispatch({
        'agriParcels': {}, 'cadIntersections': {}, 'farmPPlanData': {}, 'controlResults': [], 'agriParcelsWithControlResultGeometries': [],
        'showControlResultsContainer': false, 'farmObjId': '', 'farmObjTypeId': '', 'actionType': '', 'activeTab': '',
        'canRenderTheDigitizationButton': false
      })
    }
  }, [])

  const getYears = () => {
    const rangeOfYears = (start, end) => Array(end - start + 1).fill(start).map((year, index) => year + index)
    const startYear = 2021
    const currentYear = new Date().getFullYear()
    const years = rangeOfYears(startYear, currentYear)
    setYears(years)
    setSelectedYear(currentYear)
    filterControlResults(String(currentYear))
  }

  const filterControlResults = (year) => {
    const controlResultsArr = controlResults?.slice()
    const filteredControlResultsArr = controlResultsArr?.filter(control => strcmp(control.year, year))
    setControlResultsArr(filteredControlResultsArr)
  }

  const onControlYearChange = (e) => {
    setSelectedYear(Number(e.target.value))
    filterControlResults(e.target.value)
  }

  const getDataPanelWidth = () => {
    let width = ''
    if (isOpen) {
      width = actionType ? '555px' : '430px'
    }
    return width
  }

  return (
    <div id='data-panel' style={{ width: getDataPanelWidth() }}>
      <div className='d-flex flex-row justify-content-end align-items-center'>
        <Button id='data-panel-toggle' onClick={() => setOpen(!isOpen)} style={{ float: 'right' }}>
          <Icon name={isOpen ? 'chevron-left' : 'chevron-right'} size='16px'></Icon>
        </Button>
      </div>
      {actionType === 'sizp' && isOpen && (
        <React.Fragment>
          <div className='d-flex flex-row justify-content-center align-items-center mt-1 mb-1' style={{ gap: '5px' }}>
            {canRenderTheDigitizationButton && <StartEndDigitization />}
            <ControlResults />
          </div>
          <div className='d-flex flex-row justify-content-center align-items-center' style={{ gap: '1vh' }}>
            <ParcelInfo />
            <CadastreSearch />
            <LpisSearch />
          </div>
        </React.Fragment>
      )}
      {(actionType === 'sizp' || actionType === 'pplan' || actionType === 'preview') && isOpen &&
        <React.Fragment>
          {!showParcelInfoContainer && !showControlResultsContainer && (
            <React.Fragment>
              <FarmDataGridInfoHeader />
              <FarmDataGridNumOfParcels rows={farmData} />
              <FarmDataGridHeader gridType='agri_parcel' />
            </React.Fragment>
          )}
          {!showParcelInfoContainer && showControlResultsContainer && (
            <React.Fragment>
              <FarmDataGridInfoHeader />
              <div className='d-flex flex-row justify-content-center align-items-baseline' style={{ gap: '10px' }}>
                <label htmlFor='controlYear' style={{ fontSize: 'small' }}>Година на контрола</label>
                <select
                  name='controlYear'
                  id='controlYear'
                  value={selectedYear}
                  className='form-control'
                  style={{ width: '25%', fontSize: 'small' }}
                  onChange={onControlYearChange}
                >
                  {years.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
              <ControlResultsDataGridHeader />
            </React.Fragment>
          )}
        </React.Fragment>
      }
      {isOpen && <DataList data={data} setData={setData} controlResults={controlResultsArr} />}
    </div>
  );
}

_DataPanel.defaultProps = {
  categories: dataCategories,
}

_DataPanel.propTypes = {
  categories: PropTypes.array,
  processID: PropTypes.string,
  actionType: PropTypes.string
}

export const DataPanel = connect(state => ({
  processID: state.app.processID, actionType: state.farmRegistry?.actionType,
  farmData: state.farmRegistry?.agriParcels, showParcelInfoContainer: state.farmRegistry?.showParcelInfoContainer,
  canRenderTheDigitizationButton: state.farmRegistry?.canRenderTheDigitizationButton,
  showControlResultsContainer: state.farmRegistry?.showControlResultsContainer,
  controlResults: state.farmRegistry?.controlResults,
}))(_DataPanel);
