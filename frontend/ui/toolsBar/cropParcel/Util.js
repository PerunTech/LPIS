import { elements } from 'perun-core';
import { core, data, config as spatialConfig } from '../../../Spatial';
import { config as apConfig } from '../agriParcel/Config';
import { setLoadedPhysicalBlockLabel } from '../physicalBlock/Config';
import { config as cpConfig } from './Config';
import { strcmp } from '../../Util';

const { http, factory, store, Map } = core;
const { geobuf, protobuf } = data;
const { MIN_DIGI_SCALE } = spatialConfig;

export const cleanupWorkingCropParcelLayers = () => {
    Map.eachLayer(function (layer) {
        if (!!layer.toGeoJSON) {
            if (layer?.feature?.properties?.DESCRIPTOR && strcmp(layer?.feature?.properties?.DESCRIPTOR, 'WORKING_CROP_PARCEL_LAYER')) {
                Map.removeLayer(layer);
            }
        }
    });
}

export function loadFarmerAssets(token, id, zoom = false, msg = false) {
    // remove all layers
    const layers = store.getState().data.layers;
    Object.values(layers).forEach(layer => layer.removeFrom(Map));

    store.dispatch({ pauseGrid: true })

    http.call('getFarmerAssets', {
        url: '/lpis/get/farmerAssets/'
            + (token ? String(token) : '{gsaa.token}') + '/'
            + (id ? Number(id) : '{gsaa.farmerId}')
            + '/AGRI_PARCEL',
        method: 'get',
        baseURL: window.server,
        responseType: 'arraybuffer'
    }).then(response => {
        const data = geobuf.decode(protobuf(response));
        const geojson = factory.geoJSON(data, apConfig.pathOptions);
        const layers = geojson.getLayers();

        layers.forEach(layer => layer.addTo(Map));

        // If init calls us and agri data is found, zoom to the first parcel.
        zoom && layers.length > 0 && Map.fitBounds(layers[0].getBounds());

        layers.forEach(layer => {
            setAPLabel(layer)
            layer.on('click', () => {
                // console.log(e) add popup with cad parcels
            })
        });
    }).catch(err => console.log(err))

    http.call('getFarmerAssets', {
        url: '/lpis/get/farmerAssets/'
            + (token ? String(token) : '{gsaa.token}') + '/'
            + (id ? Number(id) : '{gsaa.farmerId}')
            + '/LAND_USE_PLAN',
        method: 'get',
        baseURL: window.server,
        responseType: 'arraybuffer'
    }).then(response => {
        const data = geobuf.decode(protobuf(response));
        const geojson = factory.geoJSON(data, cpConfig.pathOptions);
        const layers = geojson.getLayers();

        layers.forEach(layer => {
            layer.addTo(Map);
            layer.bringToFront();
            setCPLabel(layer);
        });

        msg && elements.alertUser(true, 'success', 'Парцелите се успешно освежени.')
        store.dispatch({ pauseGrid: false });
    }).catch(err => {
        console.log(err);
        store.dispatch({ pauseGrid: false });
    })
}

export const getCropLabel = idx => {
    const cropCodes = store.getState()?.cropCodes
    const cropCodesDesc = Object.values(cropCodes)
    const cropCodesIdx = Object.keys(cropCodes).map(k => Number(k))
    const cropCodeLabel = cropCodesDesc[cropCodesIdx.findIndex(val => val === idx)]
    let cropLabel = ''
    if (cropCodeLabel) {
        cropLabel = cropCodeLabel
    }
    // const str = String(cropCodesDesc[cropCodesIdx.findIndex(val => val === idx)]),
    //     getLastIdx = (char, pos) => {
    //         const idx = str.indexOf(char, pos)
    //         return idx < 0 ? false : idx + 1;
    //     },
    //     isLatin = str.match(/[a-z]/i),
    //     startIdx = isLatin
    //         ? getLastIdx('–') || getLastIdx('-') || 0
    //         : 0,
    //     endIdx = isLatin
    //         ? getLastIdx('(', startIdx + 1) || getLastIdx('-', startIdx + 1) || getLastIdx('–', startIdx + 1) || str.length
    //         : getLastIdx('(') || getLastIdx('-') || getLastIdx('–') || str.length;


    // if (!strcmp(str.substring(startIdx, endIdx), 'undefined')) {
    //     cropLabel = str.substring(startIdx, endIdx)
    // }
    return cropLabel;
}

export const setCPLabel = cp => {
    const cnt = cp.feature.properties.CENTROID;
    const latLng = cnt
        ? Map.untransform(cnt.substring(cnt.indexOf('(') + 1, cnt.indexOf(')')).split(' ').map(s => Number(s)))
        : null;

    // add tooltip
    cp.bindTooltip(getCropLabel(cp.feature.properties.CROP_CODE), {
        direction: 'bottom',
        offset: [0, 10],
        permanent: true
    })
    cp.openTooltip(latLng);

    return cp;
}

export const setAPLabel = ap => {
    const oldId = ap.feature.properties.OLD_ID || '';
    const loc = ap.feature.properties.HOME_NAME || '';
    const cnt = String(ap.feature.properties.CENTROID);
    const latLng = Map.untransform(cnt.substring(cnt.indexOf('(') + 1, cnt.indexOf(')')).split(' ').map(s => Number(s)))

    ap.bindTooltip(String(oldId + ' ' + loc), { direction: 'center', permanent: true });
    ap.openTooltip(latLng);

    return ap;
}

export const setCILabel = ci => {
    const cadParcelId = ci.feature.properties.GR_PARCEL || '';
    const municName = ci.feature.properties.MUNICIPALITY_NAME || '';
    const cnt = String(ci.feature.properties.CENTROID);
    const latLng = Map.untransform(cnt.substring(cnt.indexOf('(') + 1, cnt.indexOf(')')).split(' ').map(s => Number(s)))

    ci.bindTooltip(String(cadParcelId + ' ' + municName), { className: 'cad-intersection-tooltip', direction: 'center', permanent: true });
    ci.openTooltip(latLng);

    return ci;
}

export const setLoadedParcelLabel = loadedParcel => {
    const oldId = loadedParcel.feature.properties.OLD_ID || '';
    const loc = loadedParcel.feature.properties.HOME_NAME || '';
    const cnt = String(loadedParcel.feature.properties.CENTROID);
    const latLng = Map.untransform(cnt.substring(cnt.indexOf('(') + 1, cnt.indexOf(')')).split(' ').map(s => Number(s)))

    loadedParcel.bindTooltip(String(oldId + ' ' + loc), { direction: 'center', permanent: true });
    loadedParcel.openTooltip(latLng);

    return loadedParcel;
}

export const setSearchedParcelLabel = ap => {
    const oldId = ap.feature.properties.OLD_ID || '';
    const loc = ap.feature.properties.HOME_NAME || '';
    const cnt = String(ap.feature.properties.CENTROID);
    const latLng = Map.untransform(cnt.substring(cnt.indexOf('(') + 1, cnt.indexOf(')')).split(' ').map(s => Number(s)))

    ap.bindTooltip(String(oldId + ' ' + loc), { direction: 'center', permanent: true });
    ap.openTooltip(latLng);

    return ap;
}

export const setCadParcelLabel = cadParcel => {
    const cadParcelId = cadParcel.feature.properties.GR_PARCEL || cadParcel.feature.properties.ID || '';
    const cnt = String(cadParcel.feature.properties.CENTROID);
    const latLng = Map.untransform(cnt.substring(cnt.indexOf('(') + 1, cnt.indexOf(')')).split(' ').map(s => Number(s)))

    cadParcel.bindTooltip(String(cadParcelId), { direction: 'center', permanent: true });
    cadParcel.openTooltip(latLng);

    return cadParcel;
}

/* Map event listener for label render */
let lastZoom = MIN_DIGI_SCALE;
Map.on('zoomend', ({ target }) => {
    // Moved inside in zoom range, show label
    (target.getZoom() >= MIN_DIGI_SCALE && lastZoom < MIN_DIGI_SCALE)
        && target.eachLayer(layer => {
            if (layer.feature && layer.feature.properties) {
                // Check if the layer has a tooltip bound to it already & unbind the tooltip if it does
                if (layer.getTooltip() && layer.isTooltipOpen()) {
                    layer.unbindTooltip()
                }
                const props = layer.feature.properties;

                props.DESCRIPTOR === 'AGRI_PARCEL' && setAPLabel(layer);
                props.DESCRIPTOR === 'LAND_USE_PLAN' && setCPLabel(layer);
                props.DESCRIPTOR === 'LP_CAD_INTERSECTIONS' && setCILabel(layer);
                props.DESCRIPTOR === 'LOADED_AGRI_PARCEL' && setLoadedParcelLabel(layer)
                props.DESCRIPTOR === 'SEARCHED_LPIS_PARCEL' && setSearchedParcelLabel(layer)
                props.DESCRIPTOR === 'PHYSICAL_BLOCK' && setLoadedPhysicalBlockLabel(layer)
            }
        });

    // Moved outside of zoom range, hide label
    (target.getZoom() < MIN_DIGI_SCALE && lastZoom >= MIN_DIGI_SCALE)
        && target.eachLayer(layer => layer.unbindTooltip());

    lastZoom = target.getZoom();
})

store.addState('gsaa', { pauseGrid: false })