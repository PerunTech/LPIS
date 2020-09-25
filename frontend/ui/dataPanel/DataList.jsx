import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core'

const { TreeNode } = spatial.ui;

export const DataList = ({data}) => {
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

DataList.propTypes = {
    data: PropTypes.object
}
/*    const _generateNode = el => 
        <TreeNode 
            key={el.getLabel()} 
            label={el.getLabel()}
            collapsed={el.isCollapsed()} >
            {el.getChildren()}
        </TreeNode>

    return data.map(el => 
        <TreeNode 
            key={el.getLabel()} 
            label={el.getLabel()}
            collapsed={el.isCollapsed()} >
            {el.getChildren().map(entry => {

            })}
        </TreeNode>
    });*/