import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../Spatial';

const { factory } = core;
const { ButtonGroup, Button, Icon } = ui;

export const FarmDataGrid = ({ type, rows }) => {
  return <div id={type + '-grid'} className='data-grid' >
    <_Header typeId={type} />
    {rows.length > 0 ? <_Rows rows={rows} /> : <_NoData />}
  </div>
}

FarmDataGrid.propTypes = {
  type: PropTypes.object,
  rows: PropTypes.array
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

/* ---------------- */
/*      HEADER      */
/* ---------------- */
const colEnum = {
  agri_parcel: ['СИЗП Број', 'Класа', 'Површина', 'Право на корист.', 'Заедничка употр.'],
};

/* Column names above each set of data types in the list. */
const _Header = ({ typeId }) => {
  const columns = colEnum[typeId];

  return <ButtonGroup className='data-grid-header' id="grid-header">
    {columns.map((c, i) => {
      return <Button key={i} disabled className='data-grid-column' >{c}</Button>;
    })}
  </ButtonGroup>
}

_Header.propTypes = {
  typeId: PropTypes.string
}

/* -------------- */
/*      ROWS      */
/* ---------- --- */
const _Rows = ({ rows }) => {
  return rows.map((el) => {
    const props = el.feature && el.feature.properties;
    if (!props) return null; // exit on temp items, we don't show these.

    const id = el.feature.id
    const unit = el instanceof factory.Polygon ? 'm²' : 'm';
    return <ButtonGroup className='data-grid-row' key={id} >
      <Button disabled className='data-grid-column' >{props.OLD_ID}</Button>
      <Button disabled className='data-grid-column' >{props.LAND_COVER_CODE}</Button>
      <Button disabled className='data-grid-column' >{Math.round(Number(props.AREA)) + ` ${unit}`}</Button>
      <Button disabled className='data-grid-column' >{translateBooleanValue(props.CERTIFICATE_OF_USE)}</Button>
      <Button disabled className='data-grid-column' >{translateBooleanValue(props.COMMON_USE)}</Button>
    </ButtonGroup>
  });
}

const translateBooleanValue = value => {
  let translatedValue = ''
  switch (true) {
    case value:
      translatedValue = 'Да';
      break;
    default:
      translatedValue = 'Не';
      break;
  }

  return translatedValue;
}
