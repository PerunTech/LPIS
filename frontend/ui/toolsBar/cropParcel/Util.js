import { elements } from 'perun-core';
import { core, data } from '../../../Spatial';
import { config as apConfig } from '../agriParcel/Config';
import { config as cpConfig } from './Config';
import { crop_codes_desc, crop_codes_idx } from './Crop_Codes';

const { http, factory, store, Map } = core;
const { geobuf, protobuf } = data;

export const getCropLabel = idx => {
    const str = String(crop_codes_desc[crop_codes_idx.findIndex(val => val === idx)]);
    const getLastIdx = (char) => str.indexOf(char) > 0 ? str.indexOf(char) : false;
    
    return str.substring(0, getLastIdx('(') || getLastIdx('-') || getLastIdx('–') || str.length);
}

export const setCPLabel = cp => {
    // add tooltip
    cp.bindTooltip( getCropLabel(cp.feature.properties.CROP_CODE), {
        direction: 'bottom', 
        offset: [0, 10],
        permanent: true })
    cp.openTooltip();

    return cp;
}

export const setAPLabel = ap => {
    const oldId = ap.feature.properties.OLD_ID;
    const loc = ap.feature.properties.HOME_NAME;

    ap.bindTooltip(String(oldId + ' ' + loc), { direction: 'center', permanent: true });
    ap.openTooltip();

    return ap;
}

export function loadFarmerAssets (token, id, zoom = false, msg = false) {
    // remove all layers
    const layers = store.getState().data.layers;
    Object.values(layers).forEach(layer => layer.removeFrom(Map));

    store.dispatch({pauseGrid: true})

    http.call('getFarmerAssets', {
        url: window.server + '/lpis/get/farmerAssets/' + String(token) + '/' + Number(id)+ '/AGRI_PARCEL',
        method: 'get',
        responseType: 'arraybuffer'
    })
    .then(response => {
        const data = geobuf.decode(protobuf(response));
        const geojson = factory.geoJSON(data, apConfig.pathOptions);
        const layers = geojson.getLayers();

        layers.forEach(layer => layer.addTo(Map));

        // If init calls us and agri data is found, zoom to the first parcel.
        zoom && layers.length > 0 &&  Map.fitBounds(layers[0].getBounds());

        layers.forEach(layer => setAPLabel(layer));
    })
    .catch(err => console.log(err))

    http.call('getFarmerAssets', {
        url: window.server + '/lpis/get/farmerAssets/' + String(token) + '/' + Number(id) + '/LAND_USE_PLAN',
        method: 'get',
        responseType: 'arraybuffer'
    })
    .then(response => {
        const data = geobuf.decode(protobuf(response));
        const geojson = factory.geoJSON(data, cpConfig.pathOptions);
        const layers = geojson.getLayers();

        layers.forEach(layer => {
            console.log(layer)
            layer.addTo(Map);
            layer.bringToFront();
            setCPLabel(layer);
        });

        msg && elements.alertUser(true, 'success', 'Парцелите се успешно освежени.')
        store.dispatch({pauseGrid: false});
    })
    .catch(err => {
        console.log(err);
        store.dispatch({pauseGrid: false});
    })
}

store.addState('gsaa', { pauseGrid: false})