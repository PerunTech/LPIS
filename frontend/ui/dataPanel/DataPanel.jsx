import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../Spatial';
import { DataList } from '..';
import { FarmDataGridInfoHeader } from './FarmDataGridInfoHeader';
import { FarmDataGridNumOfParcels } from './FarmDataGridNumOfParcels';
import { FarmDataGridHeader } from './FarmDataGridHeader';
import { CadastreSearch } from './CadastreSearch';
import { LpisSearch } from './LpisSearch';
import { ParcelInfo } from './ParcelInfo';

const { Button, Icon } = ui;
const { store, connect } = core;
const { useState, useEffect } = React;

/* Root nodes in the data panel tree. */
const dataCategories = (function () {
  return Object.entries({
    physical_block: 'Физички блокови',
  }).map(entry => ({ id: entry[0], label: entry[1], isOpen: true, }))
})();

/**
 * 
 * @param {*} props 
 */
const _DataPanel = ({ categories, farmData, actionType, showParcelInfoContainer }) => {
  const [data, setData] = useState(categories);
  const [isOpen, setOpen] = useState(true);

  useEffect(() => {
    return () => {
      store.dispatch({ 'agriParcels': {}, 'cadIntersections': {}, 'farmPPlanData': {}, 'farmObjId': '', 'farmObjTypeId': '', 'actionType': '' })
    }
  }, [])

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
          <div className='d-flex flex-row justify-content-center align-items-center' style={{ gap: '1vh' }}>
            <ParcelInfo />
            <CadastreSearch />
            <LpisSearch />
          </div>
        </React.Fragment>
      )}
      {(actionType === 'sizp' || actionType === 'pplan' || actionType === 'preview') && isOpen &&
        <React.Fragment>
          {!showParcelInfoContainer && (
            <React.Fragment>
              <FarmDataGridInfoHeader />
              <FarmDataGridNumOfParcels rows={farmData} />
              <FarmDataGridHeader gridType='agri_parcel' />
            </React.Fragment>
          )}
        </React.Fragment>
      }
      {isOpen && <DataList data={data} setData={setData} />}
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
  farmData: state.farmRegistry?.agriParcels, showParcelInfoContainer: state.farmRegistry?.showParcelInfoContainer
}))(_DataPanel);
