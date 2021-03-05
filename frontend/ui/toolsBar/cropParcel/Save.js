import { elements } from 'perun-core';
import { core, data } from '../../../Spatial';
import {config} from './Config'

const { http, store, factory, Map, util } = core;
const { protobuf, geobuf } = data;

export const saveCP = (data, callback) => {
    http.call('save_cp', {
        url: '/table/createTableRecord/{init.token}/LAND_USE_PLAN/20348156/null/0/null/null',
        data: data
    })
    .then(response => {
        const data = response.data && response.data.data

        if (response.data.type === 'ERROR') {
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
            layer && layer.addTo(Map);
        }
        callback();
    })
    .catch(err => (callback(), console.log(err)))
};


// (callback(), console.log(response))