import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core'
import { DATA_CATEGORIES as dc } from '../../config';
import TreeMenu from 'react-simple-tree-menu';

const { Map, store, connect } = spatial.core;

/* internal configuration */
const _opt = {
    debounceTime: 125,
    disableKeyboard: false,
    hasSearch: true,
    resetOpenNodesOnDataUpdate: false,
}

const _DataList = ({data}) => {
    console.log(data)
    if (Object.values(data).length > 0) {
        console.log(Object.values(data)[0].getMetadata())
    }

    const goToLayer = (e) =>
(        console.log(e),
        e.parent.length > 0 
            && Map.fitBounds(data[e.parent][e.label].getBounds()));

    return <div id='dataList'>
        <TreeMenu {..._opt}  data={{}} onClickItem={goToLayer} />
    </div> 
} 

_DataList.propTypes = {
    data: PropTypes.object
}

export const DataList = connect(state => 
    ({data: state.data.layers}))(_DataList);