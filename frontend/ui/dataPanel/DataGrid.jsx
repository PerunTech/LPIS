import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core';

const { ButtonGroup, Button, Icon } = spatial.ui;

export const DataGrid = ({type, rows, ...props}) => {
    return <div id={type.id + '-grid'} >
        <_GridHeader typeId={type.id} />
        {rows.length > 0 ? <_GridRows /> : <_NoData />}
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
    cad_parcel:         [ 'Ид. Број', 'Oпштина', 'Површина'],
    measurements:       [ 'Ид. Број', 'Тип', 'Мерење' ],
    imports:            [ 'Ид. Број' ],
    pastures:           [ 'Ид. Број', 'Локалитет', 'Површина' ],
    landscape_features: [ 'Ид. Број', 'Тип', 'Број на Парцела'],
    npa:                [ 'Ид. Број', 'Име', 'Површина' ],
    soil_types:         [ 'Ид. Број', 'Тип', 'Површина' ],
    transport_network:  [ 'Ид. Број' ],
    water_bodies:       [ 'Ид. Број' ],
    resto:              [ 'Ид. Број' ]
};

/* Column names above each set of data types in the list. */
const _GridHeader = ({ typeId }) => {
    const columns = columnEnum[typeId] || columnEnum['resto'];

    return <>
        <ButtonGroup className='data-list-header' >
            <Button disabled >{columns[0]}</Button>
            <Button disabled >{columns[1]}</Button>
            <Button disabled >{columns[2]}</Button>
            <Button disabled style={{width: '60px'}} />
        </ButtonGroup>
        { /* <Divider vertical={false}/>*/}
    </>
}

_GridHeader.propTypes = {
    typeId: PropTypes.string
}

/* ----------------------- */
/*      GRID CONTENT      */
/* ---------------------- */
const _GridRows = ({rows}) => null


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