import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core';

const { factory, Map } = spatial.core;
const { ButtonGroup, Button, Icon } = spatial.ui;

export const DataGrid = ({type, rows, ...props}) => {
    return <div id={type.id + '-grid'} className='data-grid' >
        <_GridHeader typeId={type.id} />
        {rows.length > 0 ? <_GridRows rows={rows} /> : <_NoData />}
    </div>
}

DataGrid.propTypes = {
    type: PropTypes.obj,
    rows: PropTypes.arr
}

/* --------------------- */
/*      GRID HEADER      */
/* --------------------- */
const columnEnum = {
    physical_block:     [ 'Ид. Број', 'Класа', 'Површина' ],
    agri_parcel:        [ 'Ид. Број', 'ИДБР', 'Површина' ],
    cad_parcel:         [ 'Ид. Број', 'Број на КО', 'Површина'],
    measurements:       [ 'Ид. Број', 'Тип', 'Мерење' ],
    imports:            [ 'Ид. Број', 'Тип', 'Површина' ],
    pastures:           [ 'Ид. Број', 'Локалитет', 'Површина' ],
    landscape_features: [ 'Ид. Број', 'Број на ЗП', 'Површина'],
    npa:                [ 'Ид. Број', 'Назив', 'Површина' ],
    soil_types:         [ 'Ид. Број', 'Тип', 'Површина' ],
    transport_network:  [ 'Ид. Број', 'Назив', 'Должина' ],
    water_bodies:       [ 'Ид. Број', 'Назив', 'Должина' ],
    resto:              [ 'Ид. Број', 'Тип', 'Површина']
};

/* Column names above each set of data types in the list. */
const _GridHeader = ({ typeId }) => {
    const columns = columnEnum[typeId] || columnEnum['resto'];

    return <ButtonGroup className='data-grid-header' >
        <Button disabled className='data-grid-index' />
        <Button disabled className='data-grid-column' >{columns[0]}</Button>
        <Button disabled className='data-grid-column' >{columns[1]}</Button>
        <Button disabled className='data-grid-column' >{columns[2]}</Button>
        <Button disabled style={{width: '60px'}} />
    </ButtonGroup>
}

_GridHeader.propTypes = {
    typeId: PropTypes.string
}

/* ----------------------- */
/*      GRID CONTENT      */
/* ---------------------- */
const _GridRows = ({typeId, rows}) => {
    return rows.map((el) => {
        const id = el.getId(),
            name = el.getName(),
            measurement = Math.round(el.getMeasurement()),
            unit = el instanceof factory.Polygon ? 'm²' : 'm';

        // Connect and filter when id || name || measurement matches search string. Thats our search list filter.
        return <ButtonGroup className='data-grid-row' key={id} >
            <Button disabled className='data-grid-index' />
            <Button disabled className='data-grid-column' >{id}</Button>
            <Button disabled className='data-grid-column' >{'Полигон'}</Button>
            <Button disabled className='data-grid-column' >{measurement + ' ' + unit}</Button>
            <Button onClick={() => Map.fitBounds(el.getBounds())} >
                <Icon name='pinpoint' size='16px' />
            </Button>
            <Button onClick={() => console.log('more')} >
                <Icon name='more' size='16px' />
            </Button>
        </ButtonGroup>
    });
}

/* ----------------------------- */
/*      NESSUN DATO TROVATO      */
/* ----------------------------- */
const _NoData = () =>
    <div className='data-list-empty-rows' >
        <ButtonGroup >
            <Button disabled style={{opacity: 1}}>
                <Icon name='empty-grid' size='18px' />
            </Button>
            <Button disabled >Не се пронајдени податоци</Button>
        </ButtonGroup>
    </div>