import { core, data, util } from '../Spatial';
import { config as apConfig } from './toolsBar/agriParcel/Config';
import { config as cpConfig } from './toolsBar/cropParcel/Config';

const { http, factory, store } = core;
const { geobuf, protobuf } = data;

export function readCookie(name) {
    var nameEQ = name + "=";
    var ca = String("farmerObj=20348156; token=92b39ce8-e7e2-4b12-bf6b-bbd31dd04b91; _ga=GA1.1.536760576.1612264197; _gid=GA1.1.1645977351.1615282019; _gat=1"
    ).split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }

    return null;
}

export function loadFarmerAssets (token, id) {
    http.call('getFarmerAssets', {
        url: window.server + '/lpis/get/farmerAssets/' + String(token) + '/' + Number(id)+ '/AGRI_PARCEL',
        method: 'get',
        responseType: 'arraybuffer'
    })
    .then(response => {
        const data = geobuf.decode(protobuf(response))
        const geojson = factory.geoJSON(data, apConfig.pathOptions);
        const stateData = store.getState().data.layers;

        geojson.getLayers().forEach(layer => {
            const id = layer.feature.id
            // remove old app layers entries, will update with the new geojson set.
            stateData[id] && stateData[id].removeFrom(Map);
            // Flatten the geometry array, so utilities can read the thing. god knows why this happens.
            layer.setLatLngs([ ...util.flattenDeep(layer.getLatLngs()) ])

            layer.addTo(Map);
        })
    })
    .catch(err => console.log(err))

    http.call('getFarmerAssets', {
        url: window.server + '/lpis/get/farmerAssets/' + String(token) + '/' + Number(id) + '/LAND_USE_PLAN',
        method: 'get',
        responseType: 'arraybuffer'
    })
    .then(response => {
        const data = geobuf.decode(protobuf(response))
        const geojson = factory.geoJSON(data, cpConfig.pathOptions);
        const stateData = store.getState().data.layers;
        geojson.getLayers().forEach(layer => {
            const id = layer.feature.id
            // remove old app layers entries, will update with the new geojson set.
            stateData[id] && stateData[id].removeFrom(Map);
            // Flatten the geometry array, so utilities can read the thing. god knows why this happens.
            layer.setLatLngs([ ...util.flattenDeep(layer.getLatLngs()) ])
            layer.addTo(Map);
        })
    })
    .catch(err => console.log(err))
} 