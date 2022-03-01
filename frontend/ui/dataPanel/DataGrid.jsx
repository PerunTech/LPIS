import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../Spatial';
import { getCropLabel } from '..'


const { factory, Map, store } = core;
const { ButtonGroup, Button, Icon } = ui;

export const DataGrid = ({ type, rows }) => {
    return store.getState().map.id === 'gsaa-map'
        ? <div id={type.id + '-grid'} className='data-grid' >
            <_GSAAHeader typeId={type.id} />
            {rows.length > 0 ? <_GSAARows rows={rows} /> : <_NoData />}
        </div>
        : <div id={type.id + '-grid'} className='data-grid' >
            <_GridHeader typeId={type.id} />
            {rows.length > 0 ? <_GridRows rows={rows} /> : <_NoData />}
        </div>
}

DataGrid.propTypes = {
    type: PropTypes.object,
    rows: PropTypes.array
}

/* --------------------- */
/*      GRID HEADER      */
/* --------------------- */
const columnEnum = {
    physical_block: ['Ид. Број', 'Класа', 'Површина'],
    agri_parcel: ['Ид. Број', 'ИДБР', 'Површина'],
    land_use_plan: ['Ид. Број', 'ИДБР', 'Површина'],
    cad_parcel: ['Ид. Број', 'Број на КО', 'Површина'],
    measurements: ['Ид. Број', 'Тип', 'Мерење'],
    imports: ['Ид. Број', 'Тип', 'Површина'],
    pastures: ['Ид. Број', 'Локалитет', 'Површина'],
    landscape_features: ['Ид. Број', 'Број на ЗП', 'Површина'],
    npa: ['Ид. Број', 'Назив', 'Површина'],
    soil_types: ['Ид. Број', 'Тип', 'Површина'],
    transport_network: ['Ид. Број', 'Назив', 'Должина'],
    water_bodies: ['Ид. Број', 'Назив', 'Должина'],
    resto: ['Ид. Број', 'Тип', 'Површина']
};

/* Column names above each set of data types in the list. */
const _GridHeader = ({ typeId }) => {
    const columns = columnEnum[typeId] || columnEnum['resto'];

    return <ButtonGroup className='data-grid-header' id="grid-header">
        <Button disabled className='data-grid-index' />
        <Button disabled className='data-grid-column' >{columns[0]}</Button>
        <Button disabled className='data-grid-column' >{columns[1]}</Button>
        <Button disabled className='data-grid-column' >{columns[2]}</Button>
        <Button disabled style={{ width: '60px' }} />
    </ButtonGroup>
}

_GridHeader.propTypes = {
    typeId: PropTypes.string
}

/* ------------------------------ */
/*      GENERIC GRID CONTENT      */
/* ------------------------------ */
const _GridRows = ({ rows }) => {
    return rows.map((el) => {
        const id = el.getId(),
            name = el.getName(),
            measurement = Math.round(el.getMeasurement()),
            unit = el instanceof factory.Polygon ? 'm²' : 'm';

        // Connect and filter when id || name || measurement matches search string. Thats our search list filter.
        return <ButtonGroup className='data-grid-row' key={id} >
            <Button disabled className='data-grid-index' />
            <Button disabled className='data-grid-column' >{id}</Button>
            <Button disabled className='data-grid-column' >{name}</Button>
            <Button disabled className='data-grid-column' >{measurement + ' ' + unit}</Button>
            <Button className='data-grid-util' onClick={() => Map.fitBounds(el.getBounds())} >
                <Icon name='pinpoint' size='16px' />
            </Button>
            <Button className='data-grid-util' onClick={() => console.log('more')} >
                <Icon name='more' size='12px' />
            </Button>
        </ButtonGroup>
    });
}

/* ----------------------------- */
/*      NESSUN DATO TROVATO      */
/* ----------------------------- */
const _NoData = () =>
    <div className='data-grid-empty-rows' >
        <ButtonGroup >
            <Button disabled style={{ opacity: 1 }}>
                <Icon name='empty-grid' size='18px' />
            </Button>
            <Button disabled >Не се пронајдени податоци</Button>
        </ButtonGroup>
    </div>

/* --------------------------- */
/*      GSAA GRID CONTENT      */
/* --------------------------- */
/* ---------------- */
/*      HEADER      */
/* ---------------- */
const gsaaColEnum = {
    agri_parcel: ['СИЗП Број', 'Површина', 'Употреба на земјиште', 'Локалитет'],
    land_use_plan: ['СИЗП Број', 'Земјоделска култура', 'Површина', 'Број на насади'],
};

/* Column names above each set of data types in the list. */
const _GSAAHeader = ({ typeId }) => {
    const columns = gsaaColEnum[typeId];

    return columns.length > 0
        && <ButtonGroup className='data-grid-header' id="grid-header">
            <Button disabled className='data-grid-index' />
            <Button disabled className='data-grid-column' >{columns[0]}</Button>
            <Button disabled className='data-grid-column' >{columns[1]}</Button>
            <Button disabled className='data-grid-column' >{columns[2]}</Button>
            <Button disabled className='data-grid-column' >{columns[3]}</Button>
            <Button disabled style={{ width: '20px' }} />
        </ButtonGroup>
}

_GSAAHeader.propTypes = {
    typeId: PropTypes.string
}
/* -------------- */
/*      ROWS      */
/* ---------- --- */
const _GSAARows = ({ rows }) => {
    return rows.map((el) => {
        const props = el.feature && el.feature.properties;

        if (!props) return null; // exit on temp items, we don't show these.

        if (el.getMetadata().type === 'agri_parcel') {
            const id = props.OLD_ID,
                measurement = Math.round(props.ALLOWED_AREA),
                landClass = props.LAND_COVER_CODE,
                loc = props.HOME_NAME,
                unit = 'm²';

            // Connect and filter when id || name || measurement matches search string. Thats our search list filter.
            return <ButtonGroup className='data-grid-row' key={id} >
                <Button disabled className='data-grid-index' />
                <Button disabled className='data-grid-column' >{id}</Button>
                <Button disabled className='data-grid-column' >{measurement + ' ' + unit}</Button>
                <Button disabled className='data-grid-column' >{landClass}</Button>
                <Button disabled className='data-grid-column' >{loc}</Button>
                <Button className='data-grid-util' onClick={() => Map.fitBounds(el.getBounds())} >
                    <Icon name='gsaa-pinpoint' size='16px' />
                </Button>
            </ButtonGroup>
        } else {
            if (props.AGRI_PARCEL_ID === undefined) return null; // if crop parcel is not a db row, exit.

            const id = getAgriNum(props.AGRI_PARCEL_ID),
                code = getCropLabel(props.CROP_CODE), // crop_codes_desc[crop_codes_idx.findIndex(val => val === props.CROP_CODE)],
                measurement = Math.round(props.AREA),
                unit = 'm²',
                nPlants = props.NUMBER_PLANTS;

            return <ButtonGroup className='data-grid-row' key={id + measurement} >
                <Button disabled className='data-grid-index' />
                <Button disabled className='data-grid-column' >{id}</Button>
                <Button disabled className='data-grid-column' >{code}</Button>
                <Button disabled className='data-grid-column' >{measurement + ' ' + unit}</Button>
                <Button disabled className='data-grid-column' >{nPlants}</Button>
                <Button className='data-grid-util' onClick={() => Map.fitBounds(el.getBounds())} >
                    <Icon name='gsaa-pinpoint' size='16px' />
                </Button>
            </ButtonGroup>
        }
    });
}

const getAgriNum = id => {
    const layers = Object.values(store.getState().data.layers);
    const parcelArr = layers.filter(el => el.feature && el.feature.id && Number(el.feature.id) === Number(id));

    return parcelArr.length > 0
        ? parcelArr[0].feature.properties.OLD_ID
        : 0;
}