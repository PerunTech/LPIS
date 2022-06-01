import { React, elements } from 'perun-core'
import { core, data, ui } from '../../../../Spatial';
import { ProcessButton } from '../../ProcessButton';
import { cadIntersectionsConfig as config } from '../Config';
import { setCILabel } from '../../cropParcel/Util';
import { strcmp } from '../../../Util';

const { factory, store, http, Map } = core;
const { geobuf, protobuf } = data;
const { Icon } = ui;
const { alertUser } = elements;
const _iconId = 'selection-polygon';

export const getCadIntersections = () => {
  Map.eachLayer(function (layer) {
    if (!!layer.toGeoJSON) {
      if (layer?.feature?.properties?.DESCRIPTOR && strcmp(layer?.feature?.properties?.DESCRIPTOR, 'lp_cad_intersections')) {
        Map.removeLayer(layer);
      }
    }
  });

  const farmObjId = store.getState()?.farmRegistry?.farmObjId

  http.call('get-cad-intersections', {
    url: `/spatial/geometry/get/byparent/{init.token}/LP_CAD_INTERSECTIONS/${farmObjId}`,
    method: 'get',
    responseType: 'arraybuffer'
  }).then(response => {
    const data = geobuf.decode(protobuf(response))
    const geojson = factory.geoJSON(data, config.pathOptions);
    const layers = geojson.getLayers();
    layers.forEach(layer => {
      layer.addTo(Map);
      // setCILabel(layer)
    });
    const msg = 'Истите се прикажани со портокалова боја на мапата. Дополнителни информации за истите има под секоја парцела во табелата лево.'
    alertUser(true, 'success', 'Пресеците се успешно вчитани', msg)
    const prevCadIntersections = store.getState().farmRegistry?.cadIntersections;
    Object.values(prevCadIntersections).forEach(v => v.removeFrom && v.removeFrom(Map));
    store.dispatch({ 'cadIntersections': layers, showCadParcels: true })
  }).catch(error => {
    console.error(error)
    alertUser(true, 'error', 'Настана грешка при вчитување пресеци')
  })
}

export const CadIntersections = () => {
  return <ProcessButton onClick={getCadIntersections} title='Прикажи пресеци'>
    <Icon name={_iconId} size='30px' />
    <span style={{ display: 'block', marginTop: '5px' }}>Прикажи пресеци</span>
  </ProcessButton>
}
