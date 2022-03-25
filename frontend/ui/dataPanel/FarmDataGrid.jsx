import { React, PropTypes, elements } from 'perun-core';
import { core, ui } from '../../Spatial';
import { translateBooleanValue } from '../Util';

const { factory, Map, store } = core;
const { ButtonGroup, Button, Icon } = ui;
const { useState, useEffect } = React;
const { ListGroup, ProgressBar } = elements.ReactBootstrap;
const { Item: ListGroupItem } = ListGroup;

const zoomParcel = (id) => {
  const layers = store.getState().farmRegistry?.agriParcels;
  Object.values(layers).forEach(l => Number(l.getId()) === Number(id) && Map.fitBounds(l.getBounds()));
};

let hiddenAssets = [];

const getParcelVisibleIcon = (id) => {
  let iconName = 'eye-on';
  const layers = store.getState().farmRegistry.agriParcels;
  Object.values(layers).forEach((l) => {
    if (Number(l.getId()) === Number(id)) {
      if (l.options.fillOpacity == 0) {
        iconName = 'eye-light';
      }
    }
  });
  for (let i = 0; i < hiddenAssets.length; i++) {
    if (Number(hiddenAssets[i].getId()) === Number(id)) {
      iconName = 'eye-off';
    }
  }
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

const _FarmDataGrid = ({ type, rows, selectedParcelId }) => {
  useEffect(() => {
    store.dispatch({ selectedParcelId: '' })
  }, [])

  return <div id={type + '-grid'} className='data-grid'>
    {rows.length > 0 ? <_Rows rows={rows} selectedParcelId={selectedParcelId} /> : <_NoData />}
  </div>
};

_FarmDataGrid.propTypes = {
  type: PropTypes.object,
  rows: PropTypes.array,
  selectedParcelId: PropTypes.string
};

export const FarmDataGrid = core.connect(state => ({
  selectedParcelId: state.farmRegistry?.selectedParcelId
}))(_FarmDataGrid)

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

/* -------------- */
/*  EXPANDED ROW  */
/* ---------- --- */
const _ExpandedRow = ({ id, rowData, unit }) => {
  const rowId = `expanded-row-${id}`
  return <div key={rowId} id={rowId} className='data-grid-expanded-row border border-dark rounded' style={{ fontSize: '1.5vh' }}>
    <ListGroup className='text-center'>
      <ListGroupItem className='p-1'>
        Вкупна површина: <span className='font-weight-bold'>{Math.round(Number(rowData.AREA)) + ` ${unit}`}</span>
      </ListGroupItem>
      <ListGroupItem className='p-1'>
        Преклоп: <span className='font-weight-bold'>{translateBooleanValue(rowData.HAS_OVERLAP)}</span>
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
        Надморска височина: <span className='font-weight-bold'>{Math.round(rowData.Z_AVG)} m</span>
      </ListGroupItem>
      <ListGroupItem className='p-1'>
        Коефициент на искористена површина:
        <ProgressBar now={rowData.ELIGIBILITY_COEF} label={`${rowData.ELIGIBILITY_COEF}%`} />
      </ListGroupItem>
      <ListGroupItem className='p-1'>
        Органско производство: <span className='font-weight-bold'>{translateBooleanValue(rowData.ORGANIC)}</span>
      </ListGroupItem>
      <ListGroupItem className='p-1'>
        Тип на почва: <span className='font-weight-bold'>{rowData.SOIL_TYPE || 'Не е наведено'}</span>
      </ListGroupItem>
    </ListGroup>
  </div>
}

/* -------------- */
/*      ROWS      */
/* ---------- --- */
const _Rows = ({ rows, selectedParcelId }) => {
  const [rowIsExpanded, expandRow] = useState(false);
  const [selectedRowId, selectRow] = useState('');
  const [isOpen, setOpen] = useState(true);

  useEffect(() => {
    if (selectedParcelId) {
      onRowClick(selectedParcelId)
      document.getElementById(selectedParcelId)?.scrollIntoView();
    } else {
      expandRow(false)
      selectRow('')
    }
  }, [selectedParcelId])

  const onRowClick = id => {
    if (selectedRowId !== id) {
      expandRow(true);
      selectRow(id);
    } else {
      expandRow(false);
      selectRow('');
      store.dispatch({ selectedParcelId: '' })
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

  return rows.map(el => {
    const rowData = el.feature && el.feature.properties;
    if (!rowData) return null;

    const id = el.feature.id;
    let rowClassNames = ['fr-data-grid-row']
    if (rowIsExpanded && selectedRowId === id) {
      rowClassNames.push(' fr-data-grid-row-focused')
    }
    const unit = el instanceof factory.Polygon ? 'm²' : 'm';
    const homeName = rowData.HOME_NAME || 'Не е наведено';
    return <div className='container' key={id} id={id}>
      <ButtonGroup className={rowClassNames.join('')} style={{ marginLeft: '0.15rem' }} key={id} onClick={() => onRowClick(id)}>
        <Button className='fr-data-grid-column'>{rowData.OLD_ID}</Button>
        <Button className='fr-data-grid-column'>{rowData.LAND_COVER_CODE}</Button>
        <Button className='fr-data-grid-column'>{Math.round(Number(rowData.ALLOWED_AREA || rowData.AREA)) + ` ${unit}`}</Button>
        <Button className='fr-data-grid-column' title={homeName}>{homeName}</Button>
        <Button className='fr-data-grid-column'>{translateBooleanValue(rowData.COMMON_USE)}</Button>
        <Button className='fr-data-grid-column'>{translateBooleanValue(rowData.CERTIFICATE_OF_USE)}</Button>
        <Button className='data-grid-util' onClick={e => zoomParcelAction(e, el)}>
          <Icon name='pinpoint' size='14px' />
        </Button>
        <Button className='data-grid-util' onClick={e => toggleAssetFromMapAction(e, el)}>
          <Icon name={getParcelVisibleIcon(id)} size='14px' />
        </Button>
      </ButtonGroup>
      {rowIsExpanded && selectedRowId === id && <_ExpandedRow id={id} rowData={rowData} unit={unit} />}
    </div>
  });
};
