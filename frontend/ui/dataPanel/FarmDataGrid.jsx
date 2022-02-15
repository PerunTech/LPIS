import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../Spatial';
const { useState } = React;

const { factory } = core;
const { ButtonGroup, Button, Icon } = ui;

export const FarmDataGrid = ({ type, rows }) => {
  return <div id={type + '-grid'} className='data-grid'>
    <_Header typeId={type} />
    {rows.length > 0 ? <_Rows rows={rows} /> : <_NoData />}
  </div>
};

FarmDataGrid.propTypes = {
  type: PropTypes.object,
  rows: PropTypes.array,
};

/* ----------------------------- */
/*        NO DATA FOUND          */
/* ----------------------------- */
const _NoData = () => (
  <div className='data-grid-empty-rows'>
    <ButtonGroup>
      <Button disabled style={{ opacity: 1 }}>
        <Icon name='empty-grid' size='18px' />
      </Button>
      <Button disabled>Не се пронајдени податоци</Button>
    </ButtonGroup>
  </div>
);

/* ---------------- */
/*      HEADERS      */
/* ---------------- */
const colEnum = {
  agri_parcel: ['СИЗП Број', 'Класа', 'Површина', 'Право на корист.', 'Заедничка употр.'],
  agri_parcel_secondary: ['Сменета гран.', 'Експозиција', 'Локалитет', 'Невидлива гран.'],
  agri_parcel_booleans: ['Органско', 'Наводнување', 'Пејсаж. карактер.', 'Тераси']
};

/* Column names above each set of data types in the list. */
const _Header = () => {
  const columns = colEnum['agri_parcel']
  return <ButtonGroup className='data-grid-header' id='grid-header'>
    {columns.map((c, i) => {
      return <Button key={i} disabled className='data-grid-column'>{c}</Button>
    })}
  </ButtonGroup>
};

const _SecondHeader = () => {
  const secondColumns = colEnum['agri_parcel_secondary']
  return <ButtonGroup className='data-grid-header' id='grid-header'>
    {secondColumns.map((c, i) => {
      return <Button key={i} disabled className='data-grid-column'>{c}</Button>
    })}
  </ButtonGroup>
};

const _BooleanHeader = () => {
  const booleanColumns = colEnum['agri_parcel_booleans'];
  return <ButtonGroup className='data-grid-header' id='grid-header'>
    {booleanColumns.map((c, i) => {
      return <Button key={i} disabled className='data-grid-column'>{c}</Button>
    })}
  </ButtonGroup>
};

/* -------------- */
/*      ROWS      */
/* ---------- --- */
const _Rows = ({ rows }) => {
  const [rowIsExpanded, expandRow] = useState(false);
  const [selectedRowId, selectRow] = useState('');
  const onRowClick = id => {
    if (selectedRowId !== id) {
      expandRow(true)
      selectRow(id)
    } else {
      expandRow(false)
      selectRow('')
    }
  };

  return rows.map((el) => {
    const rowData = el.feature && el.feature.properties;
    if (!rowData) return null;

    const id = el.feature.id;
    const unit = el instanceof factory.Polygon ? 'm²' : 'm';
    return <>
      <ButtonGroup className='data-grid-row' key={id} onClick={() => onRowClick(id)}>
        <Button className='data-grid-column'>{rowData.OLD_ID}</Button>
        <Button className='data-grid-column'>{rowData.LAND_COVER_CODE}</Button>
        <Button className='data-grid-column'>{Math.round(Number(rowData.AREA)) + ` ${unit}`}</Button>
        <Button className='data-grid-column'>{translateBooleanValue(rowData.CERTIFICATE_OF_USE)}</Button>
        <Button className='data-grid-column'>{translateBooleanValue(rowData.COMMON_USE)}</Button>
      </ButtonGroup>
      {rowIsExpanded && selectedRowId === id && <div className='data-grid-expanded-row'>
        <_SecondHeader />
        <ButtonGroup className='data-grid-row' key={id}>
          <Button className='data-grid-column'>{translateBooleanValue(rowData.CHANGED_BORDER)}</Button>
          <Button className='data-grid-column'>{rowData.EXPOSITION_AVG}</Button>
          <Button className='data-grid-column'>{rowData.HOME_NAME}</Button>
          <Button className='data-grid-column'>{translateBooleanValue(rowData.INVISIBLE_BORDER)}</Button>
        </ButtonGroup>
        <_BooleanHeader />
        <ButtonGroup className='data-grid-row' key={id}>
          <Button className='data-grid-column'>{translateBooleanValue(rowData.ORGANIC)}</Button>
          <Button className='data-grid-column'>{translateBooleanValue(rowData.IRRIGATION)}</Button>
          <Button className='data-grid-column'>{translateBooleanValue(rowData.LANDSCAPE_FEATURES)}</Button>
          <Button className='data-grid-column'>{translateBooleanValue(rowData.TERRACE)}</Button>
        </ButtonGroup>
      </div>}
    </>
  })
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
