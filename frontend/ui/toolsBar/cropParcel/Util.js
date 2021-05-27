import { elements } from 'perun-core';
import { core, data, config as spatialConfig } from '../../../Spatial';
import { config as apConfig } from '../agriParcel/Config';
import { config as cpConfig } from './Config';
import { crop_codes_desc, crop_codes_idx } from './Crop_Codes';

const { http, factory, store, Map } = core;
const { geobuf, protobuf } = data;
const { MIN_DIGI_SCALE } = spatialConfig;

export function loadFarmerAssets (token, id, zoom = false, msg = false) {
    // remove all layers
    const layers = store.getState().data.layers;
    Object.values(layers).forEach(layer => layer.removeFrom(Map));

    store.dispatch({pauseGrid: true})

    http.call('getFarmerAssets', {
        url: '/lpis/get/farmerAssets/' 
            + (token ? String(token) : '{gsaa.token}') + '/' 
            + (id ? Number(id) : '{gsaa.farmerId}') 
            + '/AGRI_PARCEL',
        method: 'get',
        baseURL: window.server,
        responseType: 'arraybuffer'
    })
    .then(response => {
        const data = geobuf.decode(protobuf(response));
        const geojson = factory.geoJSON(data, apConfig.pathOptions);
        const layers = geojson.getLayers();

        layers.forEach(layer => layer.addTo(Map));

        // If init calls us and agri data is found, zoom to the first parcel.
        zoom && layers.length > 0 &&  Map.fitBounds(layers[0].getBounds());

        layers.forEach(layer => {
            setAPLabel(layer)
            layer.on('click', () => {
                // console.log(e) add popup with cad parcels
            })
        });
    })
    .catch(err => console.log(err))

    http.call('getFarmerAssets', {
        url: '/lpis/get/farmerAssets/' 
            + (token ? String(token) : '{gsaa.token}') + '/' 
            + (id ? Number(id) : '{gsaa.farmerId}') 
            + '/LAND_USE_PLAN',
        method: 'get',
        baseURL: window.server,
        responseType: 'arraybuffer'
    })
    .then(response => {
        const data = geobuf.decode(protobuf(response));
        const geojson = factory.geoJSON(data, cpConfig.pathOptions);
        const layers = geojson.getLayers();

        layers.forEach(layer => {
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

export const getCropLabel = idx => {
    const str = String(crop_codes_desc[crop_codes_idx.findIndex(val => val === idx)]),
        getLastIdx = (char, pos) => {
            const idx = str.indexOf(char, pos)
            return idx < 0 ? false : idx + 1;
        },
        isLatin = str.match(/[a-z]/i),
        startIdx = isLatin 
            ? getLastIdx('–') || getLastIdx('-') || 0
            : 0,
        endIdx = isLatin 
            ? getLastIdx('(', startIdx + 1) || getLastIdx('-', startIdx + 1) || getLastIdx('–', startIdx + 1) || str.length
            : getLastIdx('(') || getLastIdx('-') || getLastIdx('–') || str.length;
    
    return str.substring(startIdx, endIdx);
}

export const setCPLabel = cp => {
    const cnt = cp.feature.properties.CENTROID;
    const latLng = cnt 
        ? Map.untransform(cnt.substring(cnt.indexOf('(') + 1, cnt.indexOf(')')).split(' ').map(s => Number(s)))
        : null;

    // add tooltip
    cp.bindTooltip( getCropLabel(cp.feature.properties.CROP_CODE), {
        direction: 'bottom', 
        offset: [0, 10],
        permanent: true })
    cp.openTooltip(latLng);

    return cp;
}

export const setAPLabel = ap => {
    const oldId = ap.feature.properties.OLD_ID;
    const loc = ap.feature.properties.HOME_NAME
    const cnt = String(ap.feature.properties.CENTROID);
    const latLng = Map.untransform(cnt.substring(cnt.indexOf('(') + 1, cnt.indexOf(')')).split(' ').map(s => Number(s)))

    ap.bindTooltip(String(oldId + ' ' + loc), { direction: 'center', permanent: true });
    ap.openTooltip(latLng);

    return ap;
}

/* Map event listener for label render */
let lastZoom = MIN_DIGI_SCALE;
Map.on('zoomend', ({target}) => {
    // Moved inside in zoom range, show label
    (target.getZoom() >= MIN_DIGI_SCALE && lastZoom < MIN_DIGI_SCALE) 
        && target.eachLayer(layer => {
            if (layer.feature && layer.feature.properties) {
                const props = layer.feature.properties;

                props.DESCRIPTOR === 'AGRI_PARCEL' && setAPLabel(layer);
                props.DESCRIPTOR === 'LAND_USE_PLAN' && setCPLabel(layer);
            }
        });

    // Moved outside of zoom range, hide label
    (target.getZoom() < MIN_DIGI_SCALE && lastZoom >= MIN_DIGI_SCALE) 
        && target.eachLayer(layer => layer.unbindTooltip());

    lastZoom = target.getZoom();
}) 

store.addState('gsaa', { pauseGrid: false})