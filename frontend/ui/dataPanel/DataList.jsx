import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../Spatial';
import { DataGrid } from '..';
import { FarmDataGrid } from './FarmDataGrid';
import { InfoList } from '../toolsBar/agriParcel/digitization/Info/InfoList';

export const _DataList = ({ data, setData, actionType, showParcelInfoContainer, farmData, layers, pauseGrid }) => {
    let dataListContainerClassName = 'parcels-data-list'
    if (showParcelInfoContainer) {
        dataListContainerClassName = 'parcel-info-data-list'
    }

    return <div id='dataList' className={dataListContainerClassName}>
        {!pauseGrid && actionType !== 'sizp' && actionType !== 'pplan' && data.map((el, idx) =>
            <ui.TreeNode
                id={idx}
                key={el.id}
                label={el.label}
                isOpen={el.isOpen}
                onClick={id =>
                    setData(core.util.replaceElement(data, id, { ...data[id], isOpen: !(el.isOpen) }))} >
                {<DataGrid
                    type={el}
                    rows={Object.values(layers).filter(layer =>
                        layer.getMetadata().type === el.id)} />}
            </ui.TreeNode>)}
        {(actionType === 'sizp' || actionType === 'pplan') && !showParcelInfoContainer &&
            <FarmDataGrid type='agri_parcel' rows={farmData} actionType={actionType} />
        }
        {actionType === 'sizp' && showParcelInfoContainer && <InfoList />}
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
}))(_DataList);