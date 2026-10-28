import { React } from 'perun-core';
import { core, ui } from '../../Spatial';
import { getLabel, getMeasurementUnit, strcmp } from '../Util';
import { getCropLabel } from '../toolsBar/cropParcel/Util'

const { Map, store } = core;
const { ButtonGroup, Button, Icon } = ui;
const { useState, useEffect } = React;

const zoomParcel = (id) => {
  const layers = store.getState().farmRegistry?.controlResults;
  Object.values(layers).forEach(layer => {
    const l = layer.layer
    Number(l.getId()) === Number(id) && Map.fitBounds(l.getBounds())
  });
};

const getParcelVisibleIcon = (id) => {
  const hiddenAssets = store.getState().farmRegistry?.hiddenControlResultAssets
  const hiddenAssetsArr = hiddenAssets?.slice() || []
  const layers = store.getState().farmRegistry.controlResults;
  let iconName = 'eye-on';
  Object.values(layers).forEach((layer) => {
    const l = layer.layer
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

const toggleAssetFromMap = (id) => {
  const hiddenAssets = store.getState().farmRegistry?.hiddenControlResultAssets
  const hiddenAssetsArr = hiddenAssets?.slice() || []
  const layers = store.getState().farmRegistry?.controlResults;
  let visible = true;
  Object.values(layers).forEach((layer) => {
    const l = layer.layer
    if (Number(l.getId()) === Number(id)) {
      if (l._map && l.options.fillOpacity === 0.0) {
        l.removeFrom(Map);
        hiddenAssetsArr.push(l);
        store.dispatch({ hiddenControlResultAssets: hiddenAssetsArr })
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
        store.dispatch({ hiddenControlResultAssets: hiddenAssetsArr })
      }
    }
  }
  return visible;
};

export const ControlResultsDataGrid = ({ type, rows, controlResultEditEnabled }) => {
  useEffect(() => {
    Map.eachLayer(function (layer) {
      if (layer.toGeoJSON) {
        if (layer?.feature?.properties?.DESCRIPTOR && strcmp(layer?.feature?.properties?.DESCRIPTOR, 'spatial_control')) {
          Map.removeLayer(layer);
        }
      }
    });

    store.dispatch({ hiddenControlResultAssets: [] })

    rows.forEach(row => {
      row.layer.addTo(Map)
      row.layer.bringToBack()
    })
  }, [rows])

  return (
    <div id={type + '-grid'} className='data-grid'>
      {rows.length > 0 ? <_Rows rows={rows} controlResultEditEnabled={controlResultEditEnabled} /> : <_NoData />}
    </div>
  )
};

/* ----------------------------- */
/*        NO DATA FOUND          */
/* ----------------------------- */
const _NoData = () => (
  <div className='fr-data-grid-empty-rows'>
    <ButtonGroup>
      <Button disabled style={{ opacity: 1 }}><Icon name='empty-grid' size='18px' /></Button>
      <Button disabled>{getLabel('no_data_found')}</Button>
    </ButtonGroup>
  </div>
);

/* -------------- */
/*      ROWS      */
/* ---------- --- */
const _Rows = ({ rows, controlResultEditEnabled }) => {
  const [isOpen, setOpen] = useState(true);

  const copyGeometry = (e, el) => {
    e.stopPropagation()
    store.dispatch({ controlResultEditEnabled: true, copiedControlResultGeometry: el.layer })
  }

  const zoomParcelAction = (e, el) => {
    e.stopPropagation();
    zoomParcel(el.getId());
  }

  const toggleAssetFromMapAction = (e, el) => {
    e.stopPropagation();
    toggleAssetFromMap(el.getId());
    setOpen(!isOpen);
  }

  const translateStatus = (status) => {
    let translatedStatus = ''
    switch (true) {
      case strcmp(status, 'RFV'):
        translatedStatus = `${getLabel('control_status.rfv')}`;
        break;
      case strcmp(status, 'RFV_DONE'):
        translatedStatus = `${getLabel('control_status.rfv_done')}`;
        break;
      case strcmp(status, 'VALID'):
        translatedStatus = `${getLabel('control_status.valid')}`;
        break;
      default:
        translatedStatus = '';
        break;
    }

    return translatedStatus;
  }

  return rows.map((el, i) => {
    const rowData = el.layer.feature && el.layer.feature.properties;
    if (!rowData) return null;

    const id = el.layer.feature.id
    const status = rowData.status
    const unit = getMeasurementUnit(true)
    let cropLabel = '/'
    if (rowData.FOUND_CROP) {
      const translatedLabel = getCropLabel(Number(rowData.FOUND_CROP))
      if (translatedLabel && !strcmp(translatedLabel, 'undefined')) {
        cropLabel = translatedLabel
      }
    }
    const area = Math.round(Number(rowData.AREA)) + ` ${unit}`
    const areaWithinParcel = Math.round(Number(rowData.AREA_WITHIN_PARCEL)) + ` ${unit}`
    return (
      <div className='container' key={id} id={id}>
        <ButtonGroup className='control-results-data-grid-row' key={`${id}_${i + 1}`}>
          <Button disabled className='data-grid-index' />
          <Button disabled className='control-results-data-grid-column'>{translateStatus(status)}</Button>
          <Button disabled className='control-results-data-grid-column'>{rowData.CONTROLLED_LAND_USE}</Button>
          <Button disabled className='control-results-data-grid-column control-results-data-grid-column-crop' title={cropLabel}>{cropLabel}</Button>
          <Button disabled className='control-results-data-grid-column' title={area}>{area}</Button>
          <Button disabled className='control-results-data-grid-column' title={areaWithinParcel}>{areaWithinParcel}</Button>
          <Button disabled className='control-results-data-grid-column'>{rowData.TOLERANCE_RATIO && Math.round(rowData.TOLERANCE_RATIO)}</Button>
          <Button disabled className='control-results-data-grid-column'>{rowData.CONTROLLED_NO_PLANTS}</Button>
          <Button
            disabled={controlResultEditEnabled}
            className='data-grid-util'
            style={{ pointerEvents: controlResultEditEnabled ? 'none' : 'unset' }}
            onClick={e => copyGeometry(e, el)}
            title={getLabel('copy_geom_for_edit')}
          >
            <Icon name='copy-geometry' size='14px' />
          </Button>
          <Button className='data-grid-util' onClick={e => zoomParcelAction(e, el.layer)} title={getLabel('go_to_control_result')}>
            <Icon name='pinpoint' size='14px' />
          </Button>
          <Button className='data-grid-util' onClick={e => toggleAssetFromMapAction(e, el.layer)} title={getLabel('show_hide_control_result')}>
            <Icon name={getParcelVisibleIcon(id)} size='14px' />
          </Button>
        </ButtonGroup>
      </div>
    )
  });
};
