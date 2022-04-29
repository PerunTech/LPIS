import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../Spatial';
import { DataGrid } from '..';
import { FarmDataGrid } from './FarmDataGrid';

const { useState } = React;

export const _DataList = ({ data, setData, actionType, farmData, farmPPlanData, layers, pauseGrid }) => {
    const [isAgriParcelNodeOpen, setAgriParcelNodeOpen] = useState(true)
    const [isPPlanNodeOpen, setPPlanNodeOpen] = useState(true)

    return <div id='dataList' >
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
        {actionType === 'sizp' && <FarmDataGrid type='agri_parcel' rows={farmData} />}
        {actionType === 'pplan' && (
            <React.Fragment>
                <ui.TreeNode
                    id={0}
                    key='agri_parcel'
                    label='Земјоделски парцели'
                    isOpen={isAgriParcelNodeOpen}
                    onClick={() => setAgriParcelNodeOpen(!isAgriParcelNodeOpen)} >
                    {<DataGrid
                        type={{ id: 'agri_parcel', label: 'Земјоделски парцели' }}
                        rows={farmData} />}
                </ui.TreeNode>
                <ui.TreeNode
                    id={1}
                    key='land_use_plan'
                    label='Производни парцели'
                    isOpen={isPPlanNodeOpen}
                    onClick={() => setPPlanNodeOpen(!isPPlanNodeOpen)} >
                    {<DataGrid
                        type={{ id: 'land_use_plan', label: 'Производни парцели' }}
                        rows={farmPPlanData} />}
                </ui.TreeNode>
            </React.Fragment>
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
    farmData: PropTypes.oneOfType([
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
    farmPPlanData: state.farmRegistry?.farmPPlanData,
}))(_DataList);