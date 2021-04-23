import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../Spatial';
import { DataGrid } from '..';

export const _DataList = ({data, setData, layers, pauseGrid}) => {
    return <div id='dataList' >
        {!pauseGrid && data.map((el, idx) => 
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
    </div>
}

_DataList.propTypes = {
    data: PropTypes.object,
    setData: PropTypes.func,
    layers: PropTypes.obj,
    pauseGrid: PropTypes.bool
};

export const DataList = core.connect(state => 
    ({
        layers: state.data.layers,
        pauseGrid: state.gsaa.pauseGrid
    }))(_DataList);