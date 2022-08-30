import { React, elements } from 'perun-core'
import { core, data, ui } from '../../../../Spatial';
import { ProcessButton } from '../../ProcessButton';
import { cadIntersectionsConfig as config } from '../Config';
import { setCILabel } from '../../cropParcel/Util';
import { strcmp } from '../../../Util';

const { factory, store, connect, http, Map } = core;
const { geobuf, protobuf } = data;
const { Icon } = ui;
const { alertUser } = elements;
const { useEffect } = React;
const _iconId = 'selection-polygon';

const removeCadIntersections = (resetState = false) => {
  Map.eachLayer(function (layer) {
    if (!!layer.toGeoJSON) {
      if (layer?.feature?.properties?.DESCRIPTOR && strcmp(layer?.feature?.properties?.DESCRIPTOR, 'lp_cad_intersections')) {
        Map.removeLayer(layer);
      }
    }
  });

  resetState && store.dispatch({ 'cadIntersections': {}, showCadParcels: false })
}

export const getCadIntersections = () => {
  removeCadIntersections()
  const farmObjId = store.getState()?.farmRegistry?.farmObjId
  http.call('get-cad-intersections', {
    url: `/spatial/geometry/get/byparent/{init.token}/LP_CAD_INTERSECTIONS/${farmObjId}`,
    method: 'get',
    responseType: 'arraybuffer'
  }).then(response => {
    const data = geobuf.decode(protobuf(response))
    const geojson = factory.geoJSON(data, config.pathOptions);
    const layers = geojson.getLayers();
    if (layers && Array.isArray(layers) && layers.length > 0) {
      layers.forEach(layer => {
        layer.addTo(Map);
        setCILabel(layer)
      });
      const msg = 'Истите се прикажани со портокалова боја на мапата. Дополнителни информации за истите има под секоја парцела во табелата лево.'
      alertUser(true, 'success', 'Пресеците се успешно вчитани', msg)
      const prevCadIntersections = store.getState().farmRegistry?.cadIntersections;
      Object.values(prevCadIntersections).forEach(v => v.removeFrom && v.removeFrom(Map));
      store.dispatch({ 'cadIntersections': layers, showCadParcels: true })
    } else {
      alertUser(true, 'info', 'Не се пронајдени пресеци')
    }
  }).catch(error => {
    console.error(error)
    alertUser(true, 'error', 'Настана грешка при вчитување пресеци')
  })
}

export const _CadIntersections = ({ showCadParcels }) => {
  useEffect(() => {
    return () => {
      store.dispatch({ 'cadIntersections': {}, showCadParcels: false })
    }
  }, [])

  const label = showCadParcels ? 'Скриј пресеци' : 'Прикажи пресеци'
  const onClick = () => showCadParcels ? removeCadIntersections(true) : getCadIntersections()
  return <ProcessButton onClick={onClick} title={label}>
    <Icon name={_iconId} size='30px' />
    <span style={{ display: 'block', marginTop: '5px' }}>{label}</span>
  </ProcessButton>
}

export const CadIntersections = connect(state => ({
  processID: state.app.processID, showCadParcels: state.farmRegistry?.showCadParcels
}))(_CadIntersections)
