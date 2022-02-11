import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../Spatial';
import { DataGrid } from '..';
import { FarmDataGrid } from './FarmDataGrid';

export const _DataList = ({data, setData, mapId, farmData, layers, pauseGrid}) => {
    return <div id='dataList' >
        {!pauseGrid && mapId !== 'farm-registry-map' && data.map((el, idx) => 
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
            </ui.TreeNode> )}
        {mapId === 'farm-registry-map' && <FarmDataGrid type='agri_parcel' rows={farmData} />}
    </div>
}

_DataList.propTypes = {
    data: PropTypes.array,
    setData: PropTypes.func,
    layers: PropTypes.object,
    pauseGrid: PropTypes.bool,
    mapId: PropTypes.string,
    farmData: PropTypes.array,
};

export const DataList = core.connect(state => 
    ({
        layers: state.data.layers,
        pauseGrid: state.gsaa.pauseGrid,
        mapId: state.map.id,
        farmData: state.farmRegistry?.agriParcels,
    }))(_DataList);