import { elements } from 'perun-core';
import { core, data } from '../Spatial';
import { config as apConfig } from './toolsBar/agriParcel/Config';
import { config as cpConfig } from './toolsBar/cropParcel/Config';
import { crop_codes_desc, crop_codes_idx } from './toolsBar/cropParcel/Crop_Codes';

const { http, factory, store, Map } = core;
const { geobuf, protobuf } = data;

export function readCookie(name) {
    var nameEQ = name + "=";
    // String("farmerObj=20348156; token=92b39ce8-e7e2-4b12-bf6b-bbd31dd04b91; _ga=GA1.1.536760576.1612264197; _gid=GA1.1.1645977351.1615282019; _gat=1"
    var ca = window.parent.document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }

    return null;
}

export function loadFarmerAssets (token, id, zoom = false, msg = false) {
    // remove all layers
    const layers = store.getState().data.layers;
    Object.values(layers).forEach(layer => layer.removeFrom(Map));

    const getCropLabel = idx => {
        const str = String(crop_codes_desc[crop_codes_idx.findIndex(val => val === idx)]);
        const getLastIdx = (char) => str.indexOf(char) > 0 ? str.indexOf(char) : false;
        
        return str.substring(0, getLastIdx('(') || getLastIdx('-') || getLastIdx('–') || str.length);
    }


    http.call('getFarmerAssets', {
        url: window.server + '/lpis/get/farmerAssets/' + String(token) + '/' + Number(id)+ '/AGRI_PARCEL',
        method: 'get',
        responseType: 'arraybuffer'
    })
    .then(response => {
        const data = geobuf.decode(protobuf(response))
        const geojson = factory.geoJSON(data, apConfig.pathOptions);
        const layers = geojson.getLayers();

        layers.forEach(layer => layer.addTo(Map));

        // If init calls us and agri data is found, zoom to the first parcel.
        zoom && layers.length > 0 &&  Map.fitBounds(layers[0].getBounds());

        layers.forEach(layer => {
            layer.bindTooltip(String(layer.feature.properties.OLD_ID), { direction: 'center', permanent: true })
            layer.openTooltip();
        });
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
        const layers = geojson.getLayers();

        layers.forEach(layer => {
            layer.addTo(Map);
            layer.bringToFront()

            // add tooltip
            layer.bindTooltip( getCropLabel(layer.feature.properties.CROP_CODE), {
                direction: 'bottom', 
                offset: [0, 10],
                permanent: true })
            layer.openTooltip();
        });

        msg && elements.alertUser(true, 'success', 'Парцелите се успешно освежени.')
    })
    .catch(err => console.log(err))
}