import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core';
import { DataList, DataListUtils } from '..';

const { connect } = spatial.core;
const { Button, Divider } = spatial.ui;
const { useState, useEffect, useCallback } = React;


const _DataPanel = ({layers}) => {
    /* Transforms layers into a viable data structure for our panel. */
    const transform = useCallback(input => console.log(input), []);
    
    /* Hook into React lifecycles. Preserve internal data, refresh on each change in state.data.layers */
    const [data, setData] = useState({})
    useEffect(() => { 
        setData(transform(layers)); }, [transform, layers])

    return <div id='data-panel' style={open ? {width: '299px'} : {}}>
        {/* Data list title */}
        <Button disabled className='as-label data-panel-title' >Работна листа</Button>
        <Divider vertical={false} style={{margin: '0px'}} />
        {/* Data list utilities */}
        <DataListUtils data={data} setData={setData} transform={transform} />
        {/* Data list content */}
        <DataList data={data} />
    </div>;
}

_DataPanel.propTypes = {
    layers: PropTypes.object
}

export const DataPanel = connect(state => 
    ({layers: state.data.layers}))(_DataPanel);