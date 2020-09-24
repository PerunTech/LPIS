import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core'

const { Map, store, connect } = spatial.core;
const { TreeNode } = spatial.ui;

/* internal configuration */
const _opt = {
    debounceTime: 125,
    disableKeyboard: false,
    hasSearch: true,
    resetOpenNodesOnDataUpdate: false,
}

const _DataList = ({data}) => {
    console.log(data)

    const goToLayer = (e) =>
(        console.log(e),
        e.parent.length > 0 
            && Map.fitBounds(data[e.parent][e.label].getBounds()));

    return <div id='dataList' style={{backgroundColor: '#fff'}}>
        <TreeNode label='Физички блокови' style={{marginLeft: '5px'}} >
            <div >12345678 Употреба на земјиште Површина</div>
            <div >4321</div>
            <div >78787</div>
        </TreeNode>
        <TreeNode label='Земјоделски парцели' style={{marginLeft: '5px'}} />
        <TreeNode label='Катастарски парцели' style={{marginLeft: '5px'}} />
        <TreeNode label='Мерења' style={{marginLeft: '5px'}} />
        <TreeNode label='Увезувања' style={{marginLeft: '5px'}} />
    </div> 
} 

_DataList.propTypes = {
    data: PropTypes.object
}

export const DataList = connect(state => 
    ({data: state.data.layers}))(_DataList);