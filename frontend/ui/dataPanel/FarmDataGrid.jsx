import { React, PropTypes, elements } from 'perun-core';
import { core, ui } from '../../Spatial';
import format from 'date-fns/format'
import mk from 'date-fns/locale/mk'
import { ParcelHistory } from './ParcelHistory';
import { getCropLabel } from '../toolsBar/cropParcel/Util';
import { strcmp, translateBooleanValue } from '../Util';

const { factory, Map, store, http } = core;
const { ButtonGroup, Button, Icon } = ui;
const { useState, useEffect } = React;
const { alertUser } = elements
const { ListGroup, ProgressBar } = elements.ReactBootstrap;
const { Item: ListGroupItem } = ListGroup;

const getParcelHistory = (e, parcelId, callback) => {
  e.stopPropagation()
  http.call('get-parcel-history', {
    url: `/table/objectHistory/{init.token}/AGRI_PARCEL/${parcelId}/1`,
    method: 'get'
  }).then(res => {
    let parcelHistory = []
    if (res.data && res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
      res.data.data.forEach(el => {
        const singleHistoryObj = el
        if (el['AGRI_PARCEL.DT_INSERT']) {
          const date = new Date(el['AGRI_PARCEL.DT_INSERT'])
          const formattedDate = format(date, 'do MMMM yyyy', { locale: mk })
          Reflect.set(singleHistoryObj, 'formattedDate', formattedDate)
          parcelHistory.push(singleHistoryObj)
        }
      })
      store.dispatch({ parcelHistory })
      callback(true)
    } else {
      alertUser(true, 'info', 'Не се пронајдени податоци за историјата на парцелата')
    }
  }).catch(err => {
    console.error(err)
    alertUser(true, 'info', 'Не се пронајдени податоци за историјата на парцелата')
  })
}

const zoomParcel = (id) => {
  const layers = store.getState().farmRegistry?.agriParcels;
  Object.values(layers).forEach(l => Number(l.getId()) === Number(id) && Map.fitBounds(l.getBounds()));
};

const getParcelVisibleIcon = (id, type) => {
  const hiddenAssets = store.getState().farmRegistry?.hiddenAssets
  let hiddenAssetsArr = hiddenAssets?.slice() || []
  let iconName = 'eye-on';
  let layers = store.getState().farmRegistry.agriParcels;
  if (type) {
    if (strcmp(type, 'land_use_plan')) {
      layers = store.getState().farmRegistry?.farmPPlanData;
    } else if (strcmp(type, 'lp_cad_intersections')) {
      layers = store.getState().farmRegistry?.cadIntersections;
    }
  }
  Object.values(layers).forEach((l) => {
    if (Number(l.getId()) === Number(id)) {
      if (l.options.fillOpacity == 0) {
        iconName = 'eye-light';
      }
    }
  });
  for (let i = 0; i < hiddenAssetsArr.length; i++) {
    if (Number(hiddenAssetsArr[i].getId()) === Number(id)) {
      iconName = 'eye-off';
    }
  }
  return iconName;
};

const toggleAssetFromMap = (id, type) => {
  const hiddenAssets = store.getState().farmRegistry?.hiddenAssets
  let hiddenAssetsArr = hiddenAssets?.slice() || []
  let layers = store.getState().farmRegistry?.agriParcels;
  if (type) {
    if (strcmp(type, 'land_use_plan')) {
      layers = store.getState().farmRegistry?.farmPPlanData;
    } else if (strcmp(type, 'lp_cad_intersections')) {
      layers = store.getState().farmRegistry?.cadIntersections;
    }
  }
  let visible = true;
  Object.values(layers).forEach((l) => {
    if (Number(l.getId()) === Number(id)) {
      if (l._map && l.options.fillOpacity === 0.0) {
        l.removeFrom(Map);
        hiddenAssetsArr.push(l);
        store.dispatch({ hiddenAssets: hiddenAssetsArr })
        visible = false;
      } else {
        l.setStyle({ fillOpacity: 0 });
      }
    }
  });
  if (visible) {
    for (let i = 0; i < hiddenAssetsArr.length; i++) {
      if (Number(hiddenAssetsArr[i].getId()) === Number(id)) {
        hiddenAssetsArr[i].setStyle({ fillOpacity: 0.25 });
        hiddenAssetsArr[i].addTo(Map);
        hiddenAssetsArr.splice(i, 1);
        store.dispatch({ hiddenAssets: hiddenAssetsArr })
      }
    }
  }
  return visible;
};

const getAgriNum = (id, isPPlan) => {
  let layers = Object.values(store.getState().data.layers);
  if (isPPlan) {
    layers = store.getState().farmRegistry?.agriParcels
  }
  const parcelArr = layers.filter(el => el.feature && el.feature.id && Number(el.feature.id) === Number(id));

  return parcelArr.length > 0
    ? parcelArr[0].feature.properties.OLD_ID
    : 0;
}

const _FarmDataGrid = ({ type, rows, selectedParcelId, actionType, pplanRows, cadIntersectionRows, showCadParcels }) => {
  useEffect(() => {
    store.dispatch({ selectedParcelId: '' })
  }, [])

  return <div id={type + '-grid'} className='data-grid'>
    {rows.length > 0 ? <_Rows
      rows={rows}
      selectedParcelId={selectedParcelId}
      actionType={actionType}
      pplanRows={pplanRows}
      cadIntersectionRows={cadIntersectionRows}
      showCadParcels={showCadParcels}
    /> : <_NoData />}
  </div>
};

_FarmDataGrid.propTypes = {
  type: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string
  ]),
  rows: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),
  pplanRows: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ]),
  selectedParcelId: PropTypes.string,
  actionType: PropTypes.string,
};

export const FarmDataGrid = core.connect(state => ({
  selectedParcelId: state.farmRegistry?.selectedParcelId, pplanRows: state.farmRegistry?.farmPPlanData,
  cadIntersectionRows: state.farmRegistry?.cadIntersections, showCadParcels: state.farmRegistry?.showCadParcels
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

const _PplanDataGridGHeader = () => {
  const columns = ['СИЗП Број', 'Земјодел. култура', 'Површина', 'Број на садници']
  const columnElements = columns.map(el => <Button key={el} disabled className='data-grid-column' >{el}</Button>)
  return <ButtonGroup className='data-grid-header' id="grid-header">
    <Button disabled className='data-grid-index' />
    {columnElements}
    <Button disabled style={{ width: '60px' }} />
  </ButtonGroup>
}

const _PplanDataGrid = ({ el, rowData }) => {
  const [isOpen, setOpen] = useState(true);
  if (rowData.AGRI_PARCEL_ID === undefined) return null;
  const id = getAgriNum(rowData.AGRI_PARCEL_ID, true),
    descriptor = rowData.DESCRIPTOR,
    code = getCropLabel(rowData.CROP_CODE),
    measurement = Math.round(rowData.AREA),
    unit = 'm²',
    nPlants = rowData.NUMBER_PLANTS;

  return <ButtonGroup className='data-grid-row' key={id + measurement} >
    <Button disabled className='data-grid-index' />
    <Button disabled className='data-grid-column' >{id}</Button>
    <Button disabled className='data-grid-column' >{code}</Button>
    <Button disabled className='data-grid-column' >{measurement + ' ' + unit}</Button>
    <Button disabled className='data-grid-column' >{nPlants}</Button>
    <Button className='data-grid-util' onClick={() => Map.fitBounds(el.getBounds())} title='Оди до производна парцела'>
      <Icon name='pinpoint-secondary' size='16px' />
    </Button>
    <Button className='data-grid-util' onClick={() => {
      toggleAssetFromMap(el.getId(), descriptor)
      setOpen(!isOpen)
    }} title='Прикажи/скриј производна парцела'>
      <Icon name={getParcelVisibleIcon(el.getId(), descriptor)} size='16px' />
    </Button>
  </ButtonGroup>
}

const _PplanData = ({ parcelId, rows }) => {
  let markup = []
  if (rows && rows.length > 0) {
    rows.map((el, i) => {
      const props = el.feature.properties;
      if (props.AGRI_PARCEL_ID == parcelId) {
        markup.push(<_PplanDataGrid key={`${el.getId()}_${i + 1}`} el={el} rowData={props} />)
      }
    })
  }

  if (markup.length > 0) {
    return <React.Fragment>
      <div className='data-grid-pplan mb-2'>
        <h6 className='data-grid-heading mt-2 mb-2'>Производни парцели</h6>
        <_PplanDataGridGHeader />
        {markup}
      </div>
    </React.Fragment>
  } else {
    return <React.Fragment>
      <h6 className='data-grid-heading mt-2'>Производни парцели</h6>
      <_NoData />
    </React.Fragment>
  }
}

const _CadIntersectionsGridHeader = () => {
  const columns = ['Кат. парцела', 'Кат. општина', 'Површина']
  const columnElements = columns.map(el => <Button key={el} disabled className='data-grid-column' >{el}</Button>)
  return <ButtonGroup className='data-grid-header' id="grid-header">
    <Button disabled className='data-grid-index' />
    {columnElements}
    <Button disabled style={{ width: '60px' }} />
  </ButtonGroup>
}

const _CadIntersectionsGrid = ({ el, rowData }) => {
  const [isOpen, setOpen] = useState(true);
  if (rowData.LAND_PARCEL_ID === undefined) return null;
  const descriptor = rowData.DESCRIPTOR,
    cadParcelId = rowData.GR_PARCEL,
    municipality = rowData.MUNICIPALITY_NAME,
    measurement = Math.round(rowData.CAD_AREA),
    unit = 'm²'

  return <ButtonGroup className='data-grid-row' key={cadParcelId + measurement} >
    <Button disabled className='data-grid-index' />
    <Button disabled className='data-grid-column' >{cadParcelId}</Button>
    <Button disabled className='data-grid-column' >{municipality}</Button>
    <Button disabled className='data-grid-column' >{measurement + ' ' + unit}</Button>
    <Button className='data-grid-util' onClick={() => Map.fitBounds(el.getBounds())} title='Оди до пресек'>
      <Icon name='pinpoint-secondary' size='16px' />
    </Button>
    <Button className='data-grid-util' onClick={() => {
      toggleAssetFromMap(el.getId(), descriptor)
      setOpen(!isOpen)
    }} title='Прикажи/скриј пресек'>
      <Icon name={getParcelVisibleIcon(el.getId(), descriptor)} size='16px' />
    </Button>
  </ButtonGroup>
}

const _CadIntersectionsData = ({ parcelOldId, rows }) => {
  let markup = []
  if (rows && rows.length > 0) {
    rows.map((el, i) => {
      const props = el.feature.properties;
      if (props.LAND_PARCEL_ID == parcelOldId) {
        markup.push(<_CadIntersectionsGrid key={`${el.getId()}_${i + 1}`} el={el} rowData={props} />)
      }
    })
  }

  if (markup.length > 0) {
    return <React.Fragment>
      <div className='data-grid-pplan mb-2'>
        <h6 className='data-grid-heading mt-2 mb-2'>Пресеци</h6>
        <_CadIntersectionsGridHeader />
        {markup}
      </div>
    </React.Fragment>
  } else {
    return <React.Fragment>
      <h6 className='data-grid-heading mt-2'>Пресеци</h6>
      <_NoData />
    </React.Fragment>
  }
}

/* -------------- */
/*  EXPANDED ROW  */
/* ---------- --- */
const _ExpandedRow = ({ id, rowData, unit, actionType, pplanRows, cadIntersectionRows, showCadParcels }) => {
  const rowId = `expanded-row-${id}`
  return (
    <React.Fragment>
      {strcmp(actionType, 'pplan') && <_PplanData parcelId={id} rows={pplanRows} />}
      {strcmp(actionType, 'sizp') && showCadParcels && <_CadIntersectionsData parcelOldId={rowData.OLD_ID} rows={cadIntersectionRows} />}
      <div key={rowId} id={rowId} className='data-grid-expanded-row border border-dark rounded' style={{ fontSize: '1.5vh' }}>
        {strcmp(actionType, 'pplan') && <h6 className='data-grid-heading mt-2' style={{ border: 'none' }}>Дополнителни информации за парцелата</h6>}
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
    </React.Fragment>
  )
}

/* -------------- */
/*      ROWS      */
/* ---------- --- */
const _Rows = ({ rows, pplanRows, selectedParcelId, actionType, cadIntersectionRows, showCadParcels }) => {
  const [rowIsExpanded, expandRow] = useState(false);
  const [selectedRowId, selectRow] = useState('');
  const [isOpen, setOpen] = useState(true);
  const [showParcelHistory, setShowParcelHistory] = useState(false);

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

  const getPinpointIconName = () => {
    let pinpointIconName = 'pinpoint'
    if (strcmp(actionType, 'pplan')) {
      pinpointIconName = 'pinpoint-secondary'
    }
    return pinpointIconName
  }

  const getIconSize = () => {
    let iconSize = '14px'
    if (strcmp(actionType, 'pplan')) {
      iconSize = '16px'
    }
    return iconSize
  }

  return rows.map((el, i) => {
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
      <ButtonGroup className={rowClassNames.join('')} style={{ marginLeft: '0.15rem' }} key={`${id}_${i + 1}`} onClick={() => onRowClick(id)}>
        <Button className='fr-data-grid-column'>{rowData.OLD_ID}</Button>
        <Button className='fr-data-grid-column'>{rowData.LAND_COVER_CODE}</Button>
        <Button className='fr-data-grid-column'>{Math.round(Number(rowData.ALLOWED_AREA || rowData.AREA)) + ` ${unit}`}</Button>
        <Button className='fr-data-grid-column' title={homeName}>{homeName}</Button>
        <Button className='fr-data-grid-column'>{translateBooleanValue(rowData.COMMON_USE)}</Button>
        <Button className='fr-data-grid-column'>{translateBooleanValue(rowData.CERTIFICATE_OF_USE)}</Button>
        {strcmp(actionType, 'sizp') && (
          <Button className='data-grid-util' onClick={e => getParcelHistory(e, id, setShowParcelHistory)} title='Историја на парцела'>
            <Icon name='history' size='14px' />
          </Button>
        )}
        <Button className='data-grid-util' onClick={e => zoomParcelAction(e, el)} title='Оди до парцела'>
          <Icon name={getPinpointIconName()} size={getIconSize()} />
        </Button>
        <Button className='data-grid-util' onClick={e => toggleAssetFromMapAction(e, el)} title='Прикажи/Скриј парцела'>
          <Icon name={getParcelVisibleIcon(id)} size={getIconSize()} />
        </Button>
      </ButtonGroup>
      {rowIsExpanded && selectedRowId === id &&
        <_ExpandedRow
          id={id} rowData={rowData} unit={unit} actionType={actionType}
          pplanRows={pplanRows} cadIntersectionRows={cadIntersectionRows} showCadParcels={showCadParcels}
        />
      }
      {showParcelHistory && <ParcelHistory setShowParcelHistory={setShowParcelHistory} />}
    </div>
  });
};
