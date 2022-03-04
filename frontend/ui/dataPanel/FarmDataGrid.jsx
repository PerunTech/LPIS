import { React, PropTypes, elements } from 'perun-core';
import { core, ui } from '../../Spatial';

const { factory, Map, store } = core;
const { ButtonGroup, Button, Icon } = ui;
const { useState } = React;
const { ListGroup, ProgressBar } = elements.ReactBootstrap;
const { Item: ListGroupItem } = ListGroup;

const zoomParcel = (id) => {
  const layers = store.getState().farmRegistry?.agriParcels;
  Object.values(layers).forEach(l => Number(l.getId()) === Number(id) && Map.fitBounds(l.getBounds()));
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
        l.setStyle({ fillOpacity: 0 });
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
  const fic = store.getState().farmRegistry.fic;
  const fullName = store.getState().farmRegistry.fullName;

  return <React.Fragment>
    <_InfoHeader fic={fic} fullName={fullName} />
    <div id={type + '-grid'} className='data-grid'>
      <_Header typeId={type} />
      {rows.length > 0 ? <_Rows rows={rows} /> : <_NoData />}
    </div>
  </React.Fragment>
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
      <Button disabled style={{ opacity: 1 }}><Icon name='empty-grid' size='18px' /></Button>
      <Button disabled>Не се пронајдени податоци</Button>
    </ButtonGroup>
  </div>
);

/* ---------------- */
/*      HEADERS      */
/* ---------------- */
const colEnum = {
  agri_parcel: ['СИЗП Број', 'Класа', 'Површина', 'Заедничка употр.', 'Право на корист.', '']
};

/* Column names above each set of data types in the list. */
const _Header = () => {
  const columns = colEnum['agri_parcel'];
  return (
    <ButtonGroup className='fr-data-grid-header' id='grid-header'>
      {columns.map((c, i) => <Button key={i} disabled className='fr-data-grid-column'>{c}</Button>)}
    </ButtonGroup>
  );
};

const _InfoHeader = ({ fic, fullName }) => {
  return <div className='fr-info-header'>
    {fic && <div className='header-info-wrapper'>
      <h3 className='info-header-title'>ИДБР:</h3>
      <span className='info-header-span'>{fic}</span>
    </div>}
    {fullName && <div className='header-info-wrapper'>
      <h3 className='info-header-title'>Целосно име:</h3>
      <span className='info-header-span'>{fullName}</span>
    </div>}
  </div>
};

/* -------------- */
/*  EXPANDED ROW  */
/* ---------- --- */
const _ExpandedRow = ({ index, id, rowData, unit }) => {
  return <div key={`${id}_${index}`} id={`expanded-row-${id}_${index}`} className='data-grid-expanded-row' style={{ fontSize: '1.5vh' }}>
    <ListGroup className='text-center'>
      <ListGroupItem className='p-1'>
        Вкупна површина: <span className='font-weight-bold'>{Math.round(Number(rowData.AREA)) + ` ${unit}`}</span>
      </ListGroupItem>
      <ListGroupItem className='p-1'>
        Локалитет: <span className='font-weight-bold'>{rowData.HOME_NAME || 'Не е наведено'}</span>
      </ListGroupItem>
      <ListGroupItem className='p-1'>
        Тераси: <span className='font-weight-bold'>{translateBooleanValue(rowData.TERRACE)}</span>
      </ListGroupItem>
      <ListGroupItem className='p-1'>
        Наводнување: <span className='font-weight-bold'>{translateBooleanValue(rowData.IRRIGATION)}</span>
      </ListGroupItem>
      <ListGroupItem className='p-1'>
        Пејсажни карактеристики: <span className='font-weight-bold'>{translateBooleanValue(rowData.LANDSCAPE_FEATURES)}</span>
      </ListGroupItem>
      <ListGroupItem className='p-1'>
        Невидлива граница: <span className='font-weight-bold'>{translateBooleanValue(rowData.INVISIBLE_BORDER)}</span>
      </ListGroupItem>
      <ListGroupItem className='p-1'>
        Променета граница: <span className='font-weight-bold'>{translateBooleanValue(rowData.CHANGED_BORDER)}</span>
      </ListGroupItem>
      <ListGroupItem className='p-1'>
        Експозиција: <span className='font-weight-bold'>{rowData.EXPOSITION_AVG}</span>
      </ListGroupItem>
      <ListGroupItem className='p-1'>
        Наклон: <span className='font-weight-bold'>{rowData.SLOPE_AVG}</span>
      </ListGroupItem>
      <ListGroupItem className='p-1'>
        Надморска височина: <span className='font-weight-bold'>{rowData.Z_AVG} m</span>
      </ListGroupItem>
      <ListGroupItem className='p-1'>
        Коефициент на искористена површина:
        <ProgressBar now={rowData.ELIGIBILITY_COEF} label={`${rowData.ELIGIBILITY_COEF}%`} />
      </ListGroupItem>
      <ListGroupItem className='p-1'>
        Органско производство: <span className='font-weight-bold'>{translateBooleanValue(rowData.ORGANIC)}</span>
      </ListGroupItem>
      <ListGroupItem className='p-1'>
        Тип на почва: <span className='font-weight-bold'>/</span>
      </ListGroupItem>
    </ListGroup>
  </div>
}

/* -------------- */
/*      ROWS      */
/* ---------- --- */
const _Rows = ({ rows }) => {
  const [rowIsExpanded, expandRow] = useState(false);
  const [selectedRowId, selectRow] = useState('');
  const [isOpen, setOpen] = useState(true);
  const onRowClick = id => {
    if (selectedRowId !== id) {
      expandRow(true);
      selectRow(id);
    } else {
      expandRow(false);
      selectRow('');
    }
  };
  const zoomParcelAction = (e, el) => {
    e.stopPropagation();
    zoomParcel(el.getId());
  }
  const toggleAssetFromMapAction = (e, el) => {
    e.stopPropagation();
    toggleAssetFromMap(el.getId());
    setOpen(!isOpen);
  }

  return rows.map((el, i) => {
    const rowData = el.feature && el.feature.properties;
    if (!rowData) return null;

    const id = el.feature.id;
    const unit = el instanceof factory.Polygon ? 'm²' : 'm';
    return <div className='container' key={`${id}_${i}`}>
      <ButtonGroup className='fr-data-grid-row' key={id} onClick={() => onRowClick(id)}>
        <Button className='fr-data-grid-column'>{rowData.OLD_ID}</Button>
        <Button className='fr-data-grid-column'>{rowData.LAND_COVER_CODE}</Button>
        <Button className='fr-data-grid-column'>{Math.round(Number(rowData.ALLOWED_AREA || rowData.AREA)) + ` ${unit}`}</Button>
        <Button className='fr-data-grid-column'>{translateBooleanValue(rowData.COMMON_USE)}</Button>
        <Button className='fr-data-grid-column'>{translateBooleanValue(rowData.CERTIFICATE_OF_USE)}</Button>
        <Button className='data-grid-util' onClick={e => zoomParcelAction(e, el)}>
          <Icon name='pinpoint' size='14px' />
        </Button>
        <Button className='data-grid-util' onClick={e => toggleAssetFromMapAction(e, el)}>
          <Icon name={getParcelVisibleIcon(id)} size='14px' />
        </Button>
      </ButtonGroup>
      {rowIsExpanded && selectedRowId === id && <_ExpandedRow index={i} id={id} rowData={rowData} unit={unit} />}
    </div>
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
