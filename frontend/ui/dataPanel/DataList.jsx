import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core';
import { DataGrid } from '..';

const { replaceElement } = spatial.core.util;
const { TreeNode } = spatial.ui;

export const _DataList = ({data, setData, layers}) => 
    <div id='dataList' >
        {data.map((el, idx) => 
            <TreeNode 
                id={idx} 
                key={el.id} 
                label={el.label} 
                isOpen={el.isOpen} 
                onClick={id =>
                    setData(replaceElement(data, id, { ...data[id], isOpen: !(el.isOpen) }))} >
                {<DataGrid 
                    type={el} 
                    rows={Object.values(layers).filter(layer => 
                        layer.getMetadata().type === el.id)} />}
            </TreeNode> )}
    </div>;

_DataList.propTypes = {
    data: PropTypes.object,
    setData: PropTypes.func,
    layers: PropTypes.obj
};

export const DataList = spatial.core.connect(state => 
    ({layers: state.data.layers}))(_DataList);