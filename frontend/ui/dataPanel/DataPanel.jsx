import { React, PropTypes } from 'perun-core';
import { ui } from '../../Spatial';
import { DataList, DataListUtils } from '..';

const { Button, Divider } = ui;

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