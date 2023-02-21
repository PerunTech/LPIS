import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../Spatial';
import { DataGrid } from '..';
import { FarmDataGrid } from './FarmDataGrid';
import { ControlResultsDataGrid } from './ControlResultsDataGrid';
import { InfoList } from '../toolsBar/agriParcel/digitization/Info/InfoList';
import { strcmp } from '../Util';

export const _DataList = ({
    data, setData, actionType, showParcelInfoContainer, showControlResultsContainer,
    controlResults, loadedPhysicalBlocks, farmData, layers, pauseGrid, controlResultEditEnabled
}) => {
    let dataListContainerClassName = 'parcels-data-list'
    if (showParcelInfoContainer) {
        dataListContainerClassName = 'parcel-info-data-list'
    } else if (showControlResultsContainer) {
        dataListContainerClassName = 'control-results-data-list'
    }

    const getRows = el => {
        let rows = []
        if (!strcmp(el.id, 'physical_block')) {
            rows = Object.values(layers).filter(layer => layer.getMetadata().type === el.id)
        } else {
            rows = Object.values(loadedPhysicalBlocks)
        }
        return rows
    }

    return <div id='dataList' className={dataListContainerClassName}>
        {!pauseGrid && actionType !== 'sizp' && actionType !== 'pplan' && actionType !== 'preview' && data.map((el, idx) =>
            <ui.TreeNode
                id={idx}
                key={el.id}
                label={el.label}
                isOpen={el.isOpen}
                onClick={id =>
                    setData(core.util.replaceElement(data, id, { ...data[id], isOpen: !(el.isOpen) }))} >
                {<DataGrid type={el} rows={getRows(el)} />}
            </ui.TreeNode>)}
        {(actionType === 'sizp' || actionType === 'pplan' || actionType === 'preview') && !showParcelInfoContainer && !showControlResultsContainer &&
            <FarmDataGrid type='agri_parcel' rows={farmData} actionType={actionType} />
        }
        {actionType === 'sizp' && showParcelInfoContainer && <InfoList />}
        {actionType === 'sizp' && showControlResultsContainer && (
            <ControlResultsDataGrid type='control_results' rows={controlResults} controlResultEditEnabled={controlResultEditEnabled} />
        )}
    </div>
}

_DataList.propTypes = {
    data: PropTypes.array,
    setData: PropTypes.func,
    pplanData: PropTypes.array,
    setPplanData: PropTypes.func,
    layers: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.array
    ]),
    pauseGrid: PropTypes.bool,
    actionType: PropTypes.string,
    showParcelInfoContainer: PropTypes.bool,
    farmData: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.array
    ]),
    farmPPlanData: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.array
    ]),
};

export const DataList = core.connect(state =>
({
    layers: state.data.layers,
    pauseGrid: state.gsaa.pauseGrid,
    actionType: state.farmRegistry?.actionType,
    farmData: state.farmRegistry?.agriParcels,
    showParcelInfoContainer: state.farmRegistry?.showParcelInfoContainer,
    showControlResultsContainer: state.farmRegistry?.showControlResultsContainer,
    controlResultEditEnabled: state.farmRegistry?.controlResultEditEnabled,
    loadedPhysicalBlocks: state.lpis?.loadedPhysicalBlocks,
}))(_DataList);