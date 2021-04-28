import { elements } from 'perun-core';
import { core } from '../../../Spatial';
import {config} from './Config'
import { setCPLabel } from '../..';

const { http, factory, Map, store } = core;

export const saveCP = (data, callback) => {
    const id = store.getState().gsaa.farmerId;

    http.call('save_cp', {
        url: '/table/createTableRecord/{init.token}/LAND_USE_PLAN/' + id + '/null/0/null/null',
        data: data
    })
    .then(response => {
        const data = response.data && response.data.data

        if (response.data.type === 'ERROR' || response.data.type === 'EXCEPTION') {
            elements.alertUser(true, 
                'error', 
                response.data.title || 'Грешка при зачувување', 
                response.data.message || 'Производната парцела не е запишана во базата на податоци.');
        }  else {
            const geojsonTemplate = {
                type: 'Feature',
                id: data.object_id, 
                geometry: data.GEOM,
                properties: data
            }
    
            const geojson = factory.geoJSON(geojsonTemplate, config.pathOptions);
            const layer = Object.values(geojson._layers)[0]

            // Remove old entry on Map
            const stateData = core.store.getState().data.layers;
            const id = layer.feature.id
            stateData[id] && stateData[id].removeFrom(Map);

            layer && layer.addTo(Map);
            setCPLabel(layer)

            elements.alertUser(true, 
                'success', 
                'Успешно зачувување', 
                'Производната парцела е запишана во базата на податоци.')
        }
        callback();
    })
    .catch(err => (callback(), console.log(err)))
};