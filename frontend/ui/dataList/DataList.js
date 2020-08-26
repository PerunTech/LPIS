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
    const transformData = () => 
        Object.keys(data).map(key => {
            return { 
                key: key, 
                label: key, 
                nodes: Object.keys(data[key]).map(el => {
                    data[key][el].addTo(Map)
                    return {key: el, label: el}})
            };
        });

    const goToLayer = ({parent, label}) => 
        parent.length > 0 
            && Map.fitBounds(data[parent][label].getBounds());

    return <div id='dataList'>
        <TreeMenu {..._opt}  data={transformData()} onClickItem={goToLayer} />
    </div> 
} 

store.addState('data', {
    [dc.data_pb]: {},
    [dc.data_ap]: {},
    [dc.data_sel]: {},
    [dc.data_meas]: {},
    [dc.data_io]: {},
})

_DataList.propTypes = {
    data: PropTypes.object
}

export const DataList = connect(state => 
    ({data: state.data}))(_DataList);