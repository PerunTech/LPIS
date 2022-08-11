import { React, PropTypes } from 'perun-core';
import { core } from '../../Spatial';
import { DataList, DataListUtils } from '..';
import { FarmDataGridInfoHeader } from './FarmDataGridInfoHeader';
import { FarmDataGridHeader } from './FarmDataGridHeader';
import { CadastreSearch } from './CadastreSearch';
import { LpisSearch } from './LpisSearch';

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
        <DataListUtils setData={setData} />
        {actionType === 'sizp' && (
            <React.Fragment>
                <CadastreSearch />
                <LpisSearch />
            </React.Fragment>
        )}
        {(actionType === 'sizp' || actionType === 'pplan') &&
            <React.Fragment>
                <FarmDataGridInfoHeader />
                <FarmDataGridHeader gridType='agri_parcel' />
            </React.Fragment>
        }
        <DataList data={data} setData={setData} />
    </div>;
}

_DataPanel.defaultProps = {
    categories: dataCategories,
}

_DataPanel.propTypes = {
    categories: PropTypes.array,
    processID: PropTypes.string,
    actionType: PropTypes.string
}

export const DataPanel = core.connect(state =>
    ({ processID: state.app.processID, actionType: state.farmRegistry?.actionType }))(_DataPanel);