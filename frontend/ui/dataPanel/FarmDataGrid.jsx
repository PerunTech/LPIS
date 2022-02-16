import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../Spatial';
const { useState } = React;

const { factory, Map, store } = core;
const { ButtonGroup, Button, Icon } = ui;

const zoomParcel = (id) => {
  const layers = store.getState().farmRegistry?.agriParcels;
  Object.values(layers).forEach(
    (l) => Number(l.getId()) === Number(id) && Map.fitBounds(l.getBounds())
  );
};

let hiddenAssets = [];

const getParcelVisibleIcon = (id) => {
  let iconName = 'eye-on';
  for (let i = 0; i < hiddenAssets.length; i++) {
    if (Number(hiddenAssets[i].getId()) === Number(id)) {
      iconName = 'eye-off';
    }
  }
  const layers = store.getState().farmRegistry.agriParcels;
  Object.values(layers).forEach((l) => {
    if (Number(l.getId()) === Number(id)) {
      if (l.options.fillOpacity == 0) {
        iconName = 'eye-light';
      }
    }
  });
  return iconName;
};

const toggleAssetFromMap = (id) => {
  const layers = store.getState().farmRegistry?.agriParcels;
  let visible = true;
  Object.values(layers).forEach((l) => {
    if (Number(l.getId()) === Number(id)) {
      if (l._map && l.options.fillOpacity === 0.0) {
        l.removeFrom(Map);
        hiddenAssets.push(l);
        visible = false;
      } else {
        l.setStyle({
          fillOpacity: 0,
        });
      }
    }
  });
  if (visible) {
    for (let i = 0; i < hiddenAssets.length; i++) {
      if (Number(hiddenAssets[i].getId()) === Number(id)) {
        hiddenAssets[i].setStyle({ fillOpacity: 0.25 });
        hiddenAssets[i].addTo(Map);
        hiddenAssets.splice(i, 1);
      }
    }
  }
  return visible;
};

export const FarmDataGrid = ({ type, rows }) => {
  return (
    <div id={type + '-grid'} className='data-grid'>
      <_Header typeId={type} />
      {rows.length > 0 ? <_Rows rows={rows} /> : <_NoData />}
    </div>
  );
};

FarmDataGrid.propTypes = {
  type: PropTypes.object,
  rows: PropTypes.array,
};

/* ----------------------------- */
/*        NO DATA FOUND          */
/* ----------------------------- */
const _NoData = () => (
  <div className='fr-data-grid-empty-rows'>
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
  agri_parcel: ['СИЗП Број', 'Класа', 'Површина', 'Право на корист.', 'Заедничка употр.', ''],
  agri_parcel_secondary: ['Сменета гран.', 'Експозиција', 'Локалитет', 'Невидлива гран.'],
  agri_parcel_booleans: ['Органско', 'Наводнување', 'Пејсаж. карактер.', 'Тераси']
};

/* Column names above each set of data types in the list. */
const _Header = () => {
  const columns = colEnum['agri_parcel'];
  return (
    <ButtonGroup className='fr-data-grid-header' id='grid-header'>
      {columns.map((c, i) => {
        return <Button key={i} disabled className='fr-data-grid-column'>{c}</Button>
      })}
    </ButtonGroup>
  );
};

const _SecondHeader = () => {
  const secondColumns = colEnum['agri_parcel_secondary'];
  return (
    <ButtonGroup className='fr-data-grid-header' id='grid-header'>
      {secondColumns.map((c, i) => {
        return <Button key={i} disabled className='fr-data-grid-column'>{c}</Button>
      })}
    </ButtonGroup>
  );
};

const _BooleanHeader = () => {
  const booleanColumns = colEnum['agri_parcel_booleans'];
  return (
    <ButtonGroup className='fr-data-grid-header' id='grid-header'>
      {booleanColumns.map((c, i) => {
        return <Button key={i} disabled className='fr-data-grid-column'>{c}</Button>
      })}
    </ButtonGroup>
  );
};

/* -------------- */
/*      ROWS      */
/* ---------- --- */
const _Rows = ({ rows }) => {
  const [rowIsExpanded, expandRow] = useState(false);
  const [selectedRowId, selectRow] = useState('');
  const [isOpen, setOpen] = useState(true);
  const onRowClick = (id) => {
    if (selectedRowId !== id) {
      expandRow(true);
      selectRow(id);
    } else {
      expandRow(false);
      selectRow('');
    }
  };

  return rows.map((el) => {
    const rowData = el.feature && el.feature.properties;
    if (!rowData) return null;

    const id = el.feature.id;
    const unit = el instanceof factory.Polygon ? 'm²' : 'm';
    return (
      <div className='container'>
        <ButtonGroup className='fr-data-grid-row' key={id} onClick={() => onRowClick(id)}
        >
          <Button className='fr-data-grid-column'>{rowData.OLD_ID}</Button>
          <Button className='fr-data-grid-column'>{rowData.LAND_COVER_CODE}</Button>
          <Button className='fr-data-grid-column'>{Math.round(Number(rowData.AREA)) + ` ${unit}`}</Button>
          <Button className='fr-data-grid-column'>{translateBooleanValue(rowData.CERTIFICATE_OF_USE)}</Button>
          <Button className='fr-data-grid-column'>{translateBooleanValue(rowData.COMMON_USE)}</Button>
          <Button
            className='data-grid-util'
            onClick={(event) => {
              event.stopPropagation();
              zoomParcel(el.getId());
            }}
          >
            <Icon name='pinpoint' size='14px' />
          </Button>
          <Button
            className='data-grid-util'
            onClick={(event) => {
              event.stopPropagation();
              toggleAssetFromMap(el.getId());
              setOpen(!isOpen);
            }}
          >
            <Icon name={getParcelVisibleIcon(id)} size='14px' />
          </Button>
        </ButtonGroup>
        {rowIsExpanded && selectedRowId === id && (
          <div className='data-grid-expanded-row'>
            <_SecondHeader />
            <ButtonGroup className='fr-data-grid-row' key={id}>
              <Button className='fr-data-grid-column'>{translateBooleanValue(rowData.CHANGED_BORDER)}</Button>
              <Button className='fr-data-grid-column'>{rowData.EXPOSITION_AVG}</Button>
              <Button className='fr-data-grid-column'>{rowData.HOME_NAME}</Button>
              <Button className='fr-data-grid-column'>{translateBooleanValue(rowData.INVISIBLE_BORDER)}</Button>
            </ButtonGroup>
            <_BooleanHeader />
            <ButtonGroup className='fr-data-grid-row' key={id}>
              <Button className='fr-data-grid-column'>{translateBooleanValue(rowData.ORGANIC)}</Button>
              <Button className='fr-data-grid-column'>{translateBooleanValue(rowData.IRRIGATION)}</Button>
              <Button className='fr-data-grid-column'>{translateBooleanValue(rowData.LANDSCAPE_FEATURES)}</Button>
              <Button className='fr-data-grid-column'>{translateBooleanValue(rowData.TERRACE)}</Button>
            </ButtonGroup>
          </div>
        )}
      </div>
    );
  });
};

const translateBooleanValue = (value) => {
  let translatedValue = '';
  switch (true) {
    case value:
      translatedValue = 'Да';
      break;
    default:
      translatedValue = 'Не';
      break;
  }

  return translatedValue;
};
