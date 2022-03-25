import { React, PropTypes } from 'perun-core';
import { core } from '../../Spatial';
import { DataList, DataListUtils } from '..';
import { FarmDataGridInfoHeader } from './FarmDataGridInfoHeader';
import { FarmDataGridHeader } from './FarmDataGridHeader';

/* Root nodes in the data panel tree. */
const dataCategories = (function () {
    return Object.entries({
        physical_block: 'Физички блокови',
        agri_parcel: 'Земјоделски парцели',
        cad_parcel: 'Катастарски парцели',
        measurements: 'Мерења',
        imports: 'Увезувања',
        pastures: 'Пасишта',
        landscape_features: 'Обележја на пејсажот',
        npa: 'Заштитени подрачја',
        soil_types: 'Почвени типови',
        transport_network: 'Транспортна мрежа',
        water_bodies: 'Води',
    })
        .map(entry => ({ id: entry[0], label: entry[1], isOpen: false, }))
        .concat([{ id: 'resto', label: 'Останато', isOpen: false }]);
})();

/**
 * 
 * @param {*} props 
 */
const _DataPanel = ({ categories, actionType }) => {
    const [data, setData] = React.useState(categories);

    return <div id='data-panel' >
        {/* Data list title */}
        {/* <Button disabled className='as-label data-panel-title' /> */}
        {/*<Divider vertical={false} style={{margin: '0px'}} />*/}
        {/* Data list utilities */}
        <DataListUtils setData={setData} />
        {/* Data list content */}
        {actionType === 'sizp' &&
            <React.Fragment>
                <FarmDataGridInfoHeader />
                <FarmDataGridHeader gridType='agri_parcel' />
            </React.Fragment>
        }
        <DataList data={data} setData={setData} />
    </div>;
}

_DataPanel.defaultProps = {
    categories: dataCategories
}

_DataPanel.propTypes = {
    categories: PropTypes.array,
    processID: PropTypes.string,
    actionType: PropTypes.string
}

export const DataPanel = core.connect(state =>
    ({ processID: state.app.processID, actionType: state.farmRegistry?.actionType }))(_DataPanel);