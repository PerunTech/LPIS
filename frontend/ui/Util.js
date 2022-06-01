import { redux, createHashHistory, elements } from 'perun-core';
import { core, data } from '../Spatial';
import { setAPLabel, setCPLabel } from '.';
import { config as apConfig, metadataMain as apFormConfig, cadIntersectionsConfig } from './toolsBar/agriParcel/Config';
import { config as cpConfig } from './toolsBar/cropParcel/Config';

const history = createHashHistory();
const { alertUser } = elements;
const { store: perunStore } = redux;
const { factory, store, http, Map } = core;
const { geobuf, protobuf } = data;

/**
 * Check if two values are strings & have the same value (i.e. compare them)
 * 
 * The `localeCompare` method on the `String` interface returns `0` if the values are equal &
 * a negative (`-1` for example) or a positive number (`1` for example) if the first value is shorter or longer than the second one, respectively
 * 
 * @param {any} firstValue The first value to be checked & compared
 * @param {any} secondValue The second value lpisto be checked & compared
 */
export function strcmp (firstValue, secondValue) {
    // First, check if both of the values are strings
    if ((typeof firstValue === 'string' && typeof secondValue === 'string') || (firstValue instanceof String && secondValue instanceof String)) {
        // If both of the values are strings, compare them & return the result as a boolean value
        return firstValue.localeCompare(secondValue, undefined, { sensitivity: 'base' }) === 0 ? true : false
    } else {
        return false
    }
}

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

export function isJSON (value) {
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

export const translateBooleanValue = (value) => {
    let translatedValue = '';
    switch (true) {
        case value:
            translatedValue = 'Да';
            break;
        default:
            translatedValue = 'Не';
            break;
    }

    return translatedValue;
};

export const translateLandCoverCode = (code) => {
    let translatedValue = '/'
    // These are the available land cover codes
    const landCoverCodes = apFormConfig.schema.properties.LAND_COVER_CODE.enum
    // These are their translated values (names)
    const landCoverCodeNames = apFormConfig.schema.properties.LAND_COVER_CODE.enumNames
    // Get the position of the land cover code
    const landCoverCodeIndex = landCoverCodes.indexOf(code)
    // If it's found (therefore the number will be 0 or larger than 0), get the appropriate name for the code
    if (landCoverCodeIndex >= 0) {
        translatedValue = landCoverCodeNames[landCoverCodeIndex]
    }

    return translatedValue
};

export function readCookie (name) {
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

function handleAgriParcelClick (layer) {
    store.dispatch({ selectedParcelId: layer.feature.id, selectedCropParcelId: '' })
}

function handleCropParcelClick (layer) {
    store.dispatch({ selectedCropParcelId: layer.feature.id, selectedParcelId: String(layer.feature?.properties?.AGRI_PARCEL_ID) })
}

const getFarmData = objectId => {
    const token = perunStore.getState().security.svSession
    const url = `${window.server}/ReactElements/getRowDataByObjectId/${token}/${objectId}/FARMER`
    http.call('getFarmData', { url }).then(res => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
            const farmData = res.data[0]
            const fic = farmData['FARMER.FIC'] || ''
            const fullName = farmData['FARMER.FULL_NAME'] || ''
            store.dispatch({ fic, fullName })
        }
    }).catch(err => {
        console.error(err)
    })
}

export const getFarmMapAssets = (fitBounds = false, showAlert = false) => {
    Map.eachLayer(function (layer) {
        if (!!layer.toGeoJSON) {
            Map.removeLayer(layer);
        }
    });

    const token = perunStore.getState().security.svSession
    let searchParams = ''
    // First, check if the query params (everything after the question mark) part of the url exists
    const queryParams = window.location.hash?.split('?')[1]
    if (queryParams) {
        searchParams = `?${queryParams}`
    }
    // If no query params are present, re-route the user to the root route
    if (!searchParams) {
        history.push('/')
    } else {
        const extractedParams = {}
        const urlParams = new URLSearchParams(searchParams).entries()
        for (const [key, value] of urlParams) {
            Reflect.set(extractedParams, key, value)
        }
        const { id: farmObjId, type: farmObjTypeId, action: actionType } = extractedParams
        const validParams = (farmObjId && !strcmp(farmObjId, '0')) && (farmObjTypeId && !strcmp(farmObjTypeId, '0')) && (actionType && !strcmp(actionType, '0'))

        // If all query params are present and valid, continue as usual
        if (validParams) {
            // Get the farm data only when we first call this function
            if (fitBounds) {
                getFarmData(farmObjId)
            }
            store.dispatch({ farmObjId, farmObjTypeId, actionType })
            const url = `${window.server}/lpis/get/farmerAssets/${token}/${farmObjId}/AGRI_PARCEL`
            http.call('getFarmMapAssets', { url, method: 'get', responseType: 'arraybuffer' }).then(response => {
                // Get the land use plan data only for the appropriate action type
                if (strcmp(actionType, 'pplan')) {
                    getFarmPPlanAssets()
                }
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
                    layer.on('click', function () {
                        handleAgriParcelClick(this)
                    })
                });

                // register in app state
                store.dispatch({ 'agriParcels': layers, layers })
                showAlert && alertUser(true, 'success', 'Податоците се успешно освежени.')
                fitBounds && Map.fitBounds(geojson.getBounds(), { padding: [100, 100] });
            }).catch(err => {
                console.log(err)
                showAlert && alertUser(true, 'error', 'Настана грешка', 'Податоците не се успешно освежени.')
            });
        } else {
            // If any (or all) of the query params are not present, re-route the user to the root route
            history.push('/')
        }
    }
};

export const getFarmPPlanAssets = (showAlert = false) => {
    Map.eachLayer(function (layer) {
        if (!!layer.toGeoJSON) {
            if (layer?.feature?.properties?.DESCRIPTOR && strcmp(layer?.feature?.properties?.DESCRIPTOR, 'land_use_plan')) {
                Map.removeLayer(layer);
            }
        }
    });

    const token = perunStore.getState().security.svSession
    const farmObjId = store.getState()?.farmRegistry?.farmObjId
    const url = `${window.server}/lpis/get/farmerAssets/${token}/${farmObjId}/LAND_USE_PLAN`
    http.call('getFarmPPlanAssets', { url, method: 'get', responseType: 'arraybuffer' }).then(response => {
        const data = geobuf.decode(protobuf(response));
        // filter data for type, set approp. config in factory.geoJSON
        const geojson = factory.geoJSON(data, cpConfig.pathOptions);
        const layers = geojson.getLayers();
        layers.forEach(layer => {
            layer.addTo(Map);
            layer.bringToFront();
            setCPLabel(layer);
            layer.on('click', function () {
                handleCropParcelClick(this)
            })
        });
        //clear map of all vectors, reset state.
        const prevCropParcels = store.getState().farmRegistry.farmPPlanData;
        Object.values(prevCropParcels).forEach(v => v.removeFrom && v.removeFrom(Map));
        // register in app state
        store.dispatch({ 'farmPPlanData': layers })
        showAlert && alertUser(true, 'success', 'Податоците се успешно освежени.')
    }).catch(err => {
        console.log(err)
        showAlert && alertUser(true, 'error', 'Настана грешка', 'Податоците не се успешно освежени.')
    })
}
