import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core';
import { GEOM_TYPES } from '../../config';
import { DataList, DataListUtils } from '..';

const { Button, Divider } = spatial.ui;
/* Root nodes in the data panel tree. */
const dataCategories = (function () {
    return Object.entries(GEOM_TYPES)
        .map(entry => ({ id: entry[0], label: entry[1], isOpen: false, }))
        .concat([{ id: 'resto', label: 'Останато', isOpen: false }]);
})();

/**
 * 
 * @param {*} props 
 */
export const DataPanel = () => {
    const [data, setData] = React.useState(dataCategories);

    return <div id='data-panel' >
        {/* Data list title */}
        <Button disabled className='as-label data-panel-title' >Работна листа</Button>
        <Divider vertical={false} style={{margin: '0px'}} />
        {/* Data list utilities */}
        <DataListUtils setData={setData} />
        {/* Data list content */}
        <DataList data={data} setData={setData}  />
    </div>;
}

DataPanel.propTypes = {
    layers: PropTypes.object
}