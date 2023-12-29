import { elements } from 'perun-core';
import { core } from '../../../Spatial';
import { config } from './Config'
import { getLabel } from '../../Util';

const { http, factory, Map, store } = core;

export const saveCP = (data, callback) => {
    const id = store.getState().farmRegistry?.farmObjId
    http.call('save_cp', {
        url: '/table/createTableRecord/{init.token}/LAND_USE_PLAN/' + id + '/null/0/null/null',
        method: 'post',
        data: data
    }).then(response => {
        const data = response.data && response.data.data
        if (response.data.type === 'ERROR' || response.data.type === 'EXCEPTION') {
            elements.alertUser(true,
                'error',
                response.data.title || getLabel('something_went_wrong'),
                response.data.message || '');
        } else {
            const geojsonTemplate = {
                type: 'Feature',
                id: data.object_id,
                geometry: data.GEOM,
                properties: data
            }

            const geojson = factory.geoJSON(geojsonTemplate, config.pathOptions);
            const layer = Object.values(geojson._layers)[0]

            if (layer) {
                // Remove old entry on Map
                const stateData = core.store.getState().data.layers;
                const id = layer.feature.id
                stateData[id] && stateData[id].removeFrom(Map);
            }

            elements.alertUser(true, 'success', getLabel('successfully_saved'))
        }
        callback();
    }).catch(err => {
        console.error(err)
        const title = err.response?.data?.title || err
        const message = err.response?.data?.message || ''
        elements.alertUser(true, 'error', title, message)
        callback()
    })
};
