import { redux } from 'perun-core';
import { core, data } from '../Spatial';
import { setAPLabel } from '.';
import { config as apConfig } from './toolsBar/agriParcel/Config';

const { store: perunStore } = redux;
const { factory, store, http, Map } = core;
const { geobuf, protobuf } = data;

export const bufferToString = buffer => {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

export const decodeResponse = (response) => {
    let errorMsg = 'Земјоделската парцела не е запишана во базата на податоци.'
    const decoder = new TextDecoder()
    const decoded = decoder.decode(response.data)
    if (isJSON(decoded)) {
        const decodedJSON = JSON.parse(decoder.decode(response.data))
        if (decodedJSON && Object.keys(decodedJSON).length > 0) {
            if (decodedJSON.Label_Code) {
                errorMsg = decodedJSON.Label_Code
            }
        }
    }
    return errorMsg
}

export function isJSON(value) {
    value = !strcmp(typeof value, 'string') ? JSON.stringify(value) : value
    try {
        value = JSON.parse(value);
    } catch (e) {
        return false
    }

    if (strcmp(typeof value, 'object') && value !== null) {
        return true
    }

    return false
}

/**
 * Check if two values are strings & have the same value (i.e. compare them)
 * 
 * The `localeCompare` method on the `String` interface returns `0` if the values are equal &
 * a negative (`-1` for example) or a positive number (`1` for example) if the first value is shorter or longer than the second one, respectively
 * 
 * @param {any} firstValue The first value to be checked & compared
 * @param {any} secondValue The second value lpisto be checked & compared
 */
export function strcmp(firstValue, secondValue) {
    // First, check if both of the values are strings
    if ((typeof firstValue === 'string' && typeof secondValue === 'string') || (firstValue instanceof String && secondValue instanceof String)) {
        // If both of the values are strings, compare them & return the result as a boolean value
        return firstValue.localeCompare(secondValue, undefined, { sensitivity: 'base' }) === 0 ? true : false
    } else {
        return false
    }
}

export function readCookie(name) {
    var nameEQ = name + "=";
    // String("farmerObj=20348156; token=92b39ce8-e7e2-4b12-bf6b-bbd31dd04b91; _ga=GA1.1.536760576.1612264197; _gid=GA1.1.1645977351.1615282019; _gat=1"
    var ca = window.parent.document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }

    return null;
}

export const getFarmMapAssets = (fitBounds = false) => {
    Map.eachLayer(function (layer) {
        if (!!layer.toGeoJSON) {
            Map.removeLayer(layer);
        }
    });

    const token = perunStore.getState().security.svSession
    const farmObjId = perunStore.getState().frmapData?.farmData?.objectId || 0;
    const farmObjTypeId = perunStore.getState().frmapData?.farmData?.objectTypeId || 0;
    const tableName = perunStore.getState().frmapData?.farmData?.tableName || ""
    const data = perunStore.getState().frmapData?.farmData?.rowsData
    const fic = data?.[`${tableName}.FIC`] || 0
    const fullName = data?.[`${tableName}.FULL_NAME`] || ""

    store.dispatch({ farmObjId, farmObjTypeId, fic, fullName, tableName })
    const url = `${window.server}/lpis/get/farmerAssets/${token}/${farmObjId}/AGRI_PARCEL`
    http.call('getFarmMapAssets', { url, method: 'get', responseType: 'arraybuffer' }).then(response => {
        const data = geobuf.decode(protobuf(response));
        // filter data for type, set approp. config in factory.geoJSON
        const geojson = factory.geoJSON(data, apConfig);
        const layers = geojson.getLayers();

        //clear map of all vectors, reset state.
        const prevAgriParcels = store.getState().farmRegistry.agriParcels;
        Object.values(prevAgriParcels).forEach(v => v.removeFrom && v.removeFrom(Map));

        // send geojson to factory, visualize
        layers.forEach(layer => {
            layer.addTo(Map)
            setAPLabel(layer)
        });

        // register in app state
        store.dispatch({ 'agriParcels': layers })
        fitBounds && Map.fitBounds(geojson.getBounds(), { padding: [100, 100] });
    }).catch(err => console.log(err));
};
