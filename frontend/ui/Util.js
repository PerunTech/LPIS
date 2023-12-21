import { redux, createHashHistory, elements } from 'perun-core';
import { core, data } from '../Spatial';
import { point } from '@turf/helpers'
import isPointInPolygon from '@turf/boolean-point-in-polygon'
import { setAPLabel, setCPLabel } from '.';
import { config as apConfig, metadataMain as apFormConfig } from './toolsBar/agriParcel/Config';
import { config as cpConfig } from './toolsBar/cropParcel/Config';
import { config as crConfig } from './toolsBar/controlResults/Config';
import { eraseIoLayers } from './toolsBar/io/Util';

const history = createHashHistory();
const { alertUser } = elements;
const { store: perunStore } = redux;
const { factory, store, http, Map } = core;
const { geobuf, protobuf } = data;

/**
 * Get a full label code
 * @param  {String} labelCode The final part of the label code
 */
export function getLabel(labelCode) {
    return perunStore?.getState().intl.messages[`perun.lpis.${labelCode}`] || `perun.lpis.${labelCode}`
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

/**
 * Converts a buffer to a string
 * @param  {Buffer} buffer The buffer to be converted
 */
export const bufferToString = buffer => {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
}

/**
 * Decode a buffer response
 * @param  {Buffer} response The buffer response to be decoded
 * @param  {String} objectName The name of the object the response is for (Agricultural parcel, Physical block etc.)
 */
export const decodeResponse = (response, objectName) => {
    let errorMsg = `${getLabel('agricultural_parcel_not_saved')}`
    if (strcmp(objectName, 'physical_block')) {
        errorMsg = `${getLabel('physical_block_not_saved')}`
    } else if (strcmp(objectName, 'landscape_features')) {
        errorMsg = `${getLabel('landscape_features_not_saved')}`
    } else if (strcmp(objectName, 'get_farm_assets')) {
        errorMsg = ''
    }
    const decoder = new TextDecoder()
    const decoded = decoder.decode(response.data)
    if (isJSON(decoded)) {
        const decodedJSON = JSON.parse(decoder.decode(response.data))
        if (decodedJSON && Object.keys(decodedJSON).length > 0) {
            if (decodedJSON.Label_Code) {
                errorMsg = decodedJSON.Label_Code
            } else if (decodedJSON.title) {
                errorMsg = decodedJSON.title
            }
        }
    }
    return errorMsg
}

/**
 * Check if a given value is valid JSON
 * @param  {any} value The value to be checked
 */
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
 * Translate a boolean value to a yes/no string
 * @param  {Boolean} value The boolean value to be translated
 */
export const translateBooleanValue = (value) => {
    let translatedValue = '';
    switch (true) {
        case value:
            translatedValue = `${getLabel('yes')}`;
            break;
        default:
            translatedValue = `${getLabel('no')}`;
            break;
    }

    return translatedValue;
};

/**
 * Translate the numeric value of the land cover code field
 * @param  {String} code The land cover code to be translated
 */
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

/**
 * Reads a cookie defined on the current document
 * @param  {string} name The name of the cookie we need
 */
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

/**
 * A function for downloading files, instead of opening them in a new tab
 * @param  {Blob} response The response containing the file to be downloaded
 * @param  {String} fallbackFileName A fallback name for the file, in case it doesn't exist in the response headers
 * @param  {Function} callback An optional callback function
 */
export function downloadFile(response, fallbackFileName, callback) {
    let finalFileName = fallbackFileName || 'file'
    const resHeaders = response.headers
    // Check if the Content-Disposition header exists
    if (resHeaders['content-disposition']) {
        // If it does, it should contain the file name
        const fileName = resHeaders['content-disposition']?.split('=')[1]
        if (fileName) {
            finalFileName = fileName
        }
    }

    // Create an anchor element, append it to the body & don't display it
    const a = document.createElement('a')
    document.body.appendChild(a)
    a.style.display = 'none'
    // Create the download URL for the Blob we got as a response
    const url = window.URL.createObjectURL(response.data)
    // Set the href of the anchor element to the URL
    a.href = url
    // Set the download attribute of the anchor element to the file name
    a.download = finalFileName.trim()
    // Synthetically click the anchor element
    a.click()
    // Remove the previously created URL from the window object
    window.URL.revokeObjectURL(url)
    // Remove the anchor element
    a.remove()

    if (callback) {
        callback()
    }
}

/**
 * Dispatch data from the agricultural parcel layer to the store
 * @param  {object} layer The layer that was clicked
 */
function handleAgriParcelClick(layer) {
    store.dispatch({ selectedParcelId: layer.feature.id, selectedCropParcelId: '' })
}

/**
 * Dispatch data from the crop parcel layer to the store
 * @param  {object} layer The layer that was clicked
 */
function handleCropParcelClick(layer) {
    store.dispatch({ selectedCropParcelId: layer.feature.id, selectedParcelId: String(layer.feature?.properties?.AGRI_PARCEL_ID) })
}

/**
 * Get the farm digitization state (active or inactive) according to the LPIS-DGTZ system param
 * @param  {String} objectId The object ID of the farm
 */
export const getFarmDigitizationState = objectId => {
    const token = perunStore.getState().security.svSession
    const url = `${window.server}/WsConf/params/get/${token}/LPIS-DGTZ/${objectId}`
    http.call('getFarmDigitizationState', { url }).then(res => {
        store.dispatch({ canRenderTheDigitizationButton: true, digitizationIsActive: res.data.VALUE })
    }).catch(err => {
        console.error(err)
        store.dispatch({ canRenderTheDigitizationButton: true, digitizationIsActive: false })
    })
}

/**
 * Get the control results for a given list of controls
 * @param  {Array} controls A list of controls for which we need the results
 */
const getControlResults = (controls) => {
    const promises = controls.map(async control => {
        const { objectId, year } = control
        const url = `/lpis/get/control/results/{init.token}/${objectId}`
        const reqConfig = { url, method: 'get', responseType: 'arraybuffer' }
        return await http.call('getControlResults', reqConfig).then(response => ({ response, objectId, year })).catch(err => console.error(err))
    })

    const agriParcels = store.getState()?.farmRegistry?.agriParcels
    const controlResults = [...store.getState()?.farmRegistry?.controlResults]
    const agriParcelsWithControlResultGeometries = []
    let agriParcelsWithControlResultGeometriesGeoJSON = []
    Promise.all(promises).then(promise => {
        promise.forEach(result => {
            const { objectId, year, response } = result
            const data = geobuf.decode(protobuf(response));
            const geojson = factory.geoJSON(data, crConfig.pathOptions);
            const layers = geojson.getLayers();
            if (layers.length > 0) {
                layers.forEach(layer => {
                    const controlResult = { controlObjId: objectId, year, layer }
                    controlResults.push(controlResult)
                    if (agriParcels?.length > 0) {
                        agriParcels.forEach(ap => {
                            if (strcmp(ap.getId(), String(layer.feature.properties.PARCEL_OBJ_ID))) {
                                const agriParcel = factory.GeoJSON.fromLayer(ap)
                                agriParcel.geometry = layer.feature.geometry
                                agriParcelsWithControlResultGeometries.push(agriParcel)
                                const geojson = factory.geoJSON(agriParcelsWithControlResultGeometries, apConfig);
                                agriParcelsWithControlResultGeometriesGeoJSON = geojson.getLayers()
                            }
                        })
                    }

                })
            }

            store.dispatch({ agriParcelsWithControlResultGeometries: agriParcelsWithControlResultGeometriesGeoJSON })
        })
    }).catch(err => {
        console.error(err)
    }).finally(() => {
        store.dispatch({ controlResults })
    })
}

/**
 * Get the controls for a given farm, using the FIC field of it
 * @param  {String} fic The FIC of the farm we need to get the controls for
 */
const getControls = (fic) => {
    const url = `/ReactElements/getTableWithFilter/{init.token}/CONTROL/BID/${fic}/100`
    http.call('getControls', { url, method: 'get' }).then(res => {
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
            const controls = []
            res.data.forEach(control => {
                const subjectOfControl = control['CONTROL.SUBJECT_OF_CONTROL']
                if (!strcmp(subjectOfControl, 'LIVESTOCK')) {
                    controls.push({
                        objectId: control['CONTROL.OBJECT_ID'],
                        year: control['CONTROL.YEAR']
                    })
                }
            })
            getControlResults(controls)
        }
    }).catch(err => {
        console.error(err)
    })
}

/**
 * Get data for a given farm
 * @param  {String} objectId The object ID of the farm
 * @param  {String} actionType The current action type (sizp, pplan, preview)
 */
const getFarmData = (objectId, actionType) => {
    const token = perunStore.getState().security.svSession
    const url = `${window.server}/ReactElements/searchTable/${token}/FARM/1`
    const data = { OBJECT_ID: objectId }
    http.call('getFarmData', { url, method: 'post', data: JSON.stringify(data) }).then(res => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
            const farmData = res.data[0]
            const fic = farmData['FARM.FIC'] || ''
            const fullName = farmData['FARM.FULL_NAME'] || ''
            store.dispatch({ fic, fullName })
            // Get the controls only for the appropriate action type
            if (fic && strcmp(actionType, 'sizp')) {
                getControls(fic)
            }
        }
    }).catch(err => {
        console.error(err)
    })
}

/**
 * Get map-related data (ex. parcel polygons) for a given farm
 * @param  {Boolean} fitBounds Indicator for whether to fit the resulting geo data bounds (i.e. to zoom in to the location of the bounds)
 * @param  {Boolean} showAlert Indicator for whether to show an alert after the WS is called
 */
export const getFarmMapAssets = (fitBounds = false, showAlert = false) => {
    store.dispatch({ hiddenAssets: [] })
    Map.eachLayer(function (layer) {
        if (!!layer.toGeoJSON) {
            // Remove everything when we first call this function
            if (fitBounds) {
                Map.removeLayer(layer);
                store.dispatch({ hiddenControlResultAssets: [] })
            } else {
                // These are checks to skip the layers which have been manually loaded by the user using the agriParcel/digitization/Load.jsx component
                // or the control result layers
                if (!strcmp(layer?.feature?.properties?.DESCRIPTOR, 'LOADED_AGRI_PARCEL') && !strcmp(layer?.feature?.properties?.DESCRIPTOR, 'SPATIAL_CONTROL')) {
                    if ((layer?.options?.name && strcmp(layer.options.name, 'marker-point')) || layer instanceof factory.LayerGroup) {
                        return false
                    } else {
                        Map.removeLayer(layer);
                    }
                }
            }
        } else {
            // Do whatever only when we first call this function
            if (fitBounds) {
                // This will remove any overlays that have been previously used
                if (layer?.options?.isOverlay) {
                    Map.removeLayer(layer);
                }
            }
        }
    });

    const token = perunStore.getState().security.svSession
    let searchParams = ''
    // First, check if the query params (everything after the question mark) part of the url exists
    const queryParams = window.location.hash?.split('?')[1]
    if (queryParams) {
        searchParams = `?${queryParams}`
    } else {
        const farmObjId = perunStore.getState()['farm_registry.mapData']?.farmData?.objectId || '0'
        const farmObjTypeId = perunStore.getState()['farm_registry.mapData']?.farmData?.objectTypeId || '0'
        searchParams = `?id=${farmObjId}&type=${farmObjTypeId}&action=sizp`
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
                // Get the farm digitization state only for the appropriate action type
                if (strcmp(actionType, 'sizp')) {
                    getFarmDigitizationState(farmObjId)
                }
                getFarmData(farmObjId, actionType)
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
                showAlert && alertUser(true, 'success', `${getLabel('the_data_was_refreshed')}`)
                fitBounds && Map.fitBounds(geojson.getBounds(), { padding: [100, 100] });
            }).catch(err => {
                console.log(err)
                showAlert && alertUser(true, 'error', `${getLabel('something_went_wrong')}`, `${getLabel('the_data_was_not_refreshed')}`)
            });
        } else {
            // If any (or all) of the query params are not present, re-route the user to the root route
            history.push('/')
        }
    }
};

/**
 * Get map-related data (ex. crop parcel polygons) for a given farm's produce plan
 * @param  {Boolean} showAlert Indicator for whether to show an alert after the WS is called
 */
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
        showAlert && alertUser(true, 'success', `${getLabel('the_data_was_refreshed')}`)
    }).catch(err => {
        console.log(err)
        showAlert && alertUser(true, 'error', `${getLabel('something_went_wrong')}`, `${getLabel('the_data_was_not_refreshed')}`)
    })
}

/**
 * Get a random point contained in a given polygon
 * @param  {object} polygon The polygon in which the point needs to be contained
 */
export const getRandomPointInPolygon = (polygon) => {
    const bounds = polygon.getBounds();
    const x_min = bounds.getEast();
    const x_max = bounds.getWest();
    const y_min = bounds.getSouth();
    const y_max = bounds.getNorth();

    const lat = y_min + (Math.random() * (y_max - y_min));
    const lng = x_min + (Math.random() * (x_max - x_min));

    const randomPoint = point([lng, lat]);
    const poly = polygon.toGeoJSON();
    const isInside = isPointInPolygon(randomPoint, poly);

    if (isInside) {
        return randomPoint
    } else {
        return getRandomPointInPolygon(polygon)
    }
}

/**
 * Get the CRS code defined as a parameter in the svarog.properties file
 */
export const getDbCRS = () => {
    const token = JSON.parse(localStorage.getItem('reduxPersist:security'))?.svSession
    const url = `${window.server}/WsConf/params/get/conf/${token}/sys.gis.default_srid`
    http.call('getDbCRS', { url }).then(res => {
        if (res?.data?.VALUE) {
            const dbCRS = res?.data?.VALUE
            store.addState('dbCRSCode', { dbCRS })
            if (dbCRS === '3857') {
                store.addState('dbCRS', factory.CRS.EPSG3857)
            } else if (dbCRS === '3395') {
                store.addState('dbCRS', factory.CRS.EPSG3395)
            } else if (dbCRS === '4326') {
                store.addState('dbCRS', factory.CRS.EPSG4326)
            }
        } else {
            store.addState('dbCRS', factory.CRS.EPSG4326)
        }
    }).catch(err => {
        console.error(err)
        store.addState('dbCRS', factory.CRS.EPSG4326)
    })
}

/**
 * Get all objects (tables) that contain geometry
 */
export const getLayers = () => {
    const token = JSON.parse(localStorage.getItem('reduxPersist:security'))?.svSession
    http.call('get-all-layers', {
        url: `${window.server}/spatial/getLayers/${token}`
    }).then(res => {
        const systemLayers = {}
        if (res.data && res.data.items && Array.isArray(res.data.items) && res.data.items.length > 0) {
            res.data.items.forEach(systemLayer => Reflect.set(systemLayers, systemLayer.TABLE_NAME, systemLayer.LABEL_CODE))
            store.addState('systemLayersFull', res.data.items)
        }
        store.addState('systemLayers', systemLayers)
    }).catch(err => {
        console.error(err)
        store.addState('systemLayers', {})
    })
}

/**
 * Get information about a WMS feature
 * @param  {object} params An object containing all of the parameters needed to get info about a feature
 */
export const getFeatureInfo = (params) => {
    // Only call the service if the current active process is the one for importing WMS layers/features
    const processID = store.getState().app.processID
    if (processID && strcmp(processID, 'import-wms')) {
        const { layers, bbox, height, width, infoFormat, x, y } = params
        const token = perunStore.getState().security.svSession
        const encodedLayers = encodeURIComponent(layers)
        const encodedInfoFormat = encodeURIComponent(infoFormat)
        const roundHeight = Math.round(height)
        const roundWidth = Math.round(width)
        const roundX = Math.round(x)
        const roundY = Math.round(y)
        http.call('get-feature-info', {
            url: `${window.server}/spatial/getFeatureInfo/${token}/${encodedLayers}/${bbox}/${roundHeight}/${roundWidth}/${encodedInfoFormat}/${roundX}/${roundY}`
        }).then(res => {
            // Remove any previously loaded layers from the map
            eraseIoLayers()
            if (res.data && isJSON(res.data)) {
                store.addState('selectedWmsFeature', res.data)
                const geojson = factory.geoJSON(res.data, apConfig.pathOptions);
                const layers = geojson.getLayers();
                layers.forEach(layer => {
                    layer.DESCRIPTOR = 'IO_LAYER'
                    layer.addTo(Map)
                    Map.fitBounds(layer.getBounds())
                });
            }
        }).catch(err => {
            console.error(err)
            alertUser(true, 'error', err)
            // Remove any previously loaded layers from the map
            eraseIoLayers()
        })
    }
}

/**
 * Get a list of available layers (Basemap or Overlays) in the system
 */
export const getGeoTypeLayers = () => {
    const token = JSON.parse(localStorage.getItem('reduxPersist:security'))?.svSession
    const tableName = 'GEO_LAYER_TYPE'
    const server = window.server.substr(0, window.server.lastIndexOf('/'))
    const layers = []
    const basemap = {}
    const overlays = {}
    const externalLayers = []
    http.call('get-layers', {
        url: `${window.server}/ReactElements/getTableData/${token}/${tableName}/100`
    }).then(res => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
            res.data.forEach(geoTypeLayer => {
                const layerType = geoTypeLayer?.[`${tableName}.LAYER_TYPE`]
                const layerProtocol = geoTypeLayer?.[`${tableName}.PROTOCOL`]
                const layerUrl = geoTypeLayer?.[`${tableName}.URL`]
                const layerGroup = geoTypeLayer?.[`${tableName}.LAYER_GROUP`] || 'Other'
                const title = geoTypeLayer?.[`${tableName}.TITLE`]
                const labelCode = geoTypeLayer?.[`${tableName}.LABEL_CODE`] || title
                let tileLayer
                if (strcmp(layerProtocol, 'wms')) {
                    const tileLayerOptions = {
                        layers: title,
                        format: 'image/png',
                        transparent: true,
                        // If the layer is an overlay, set the tiled property for it
                        ...strcmp(layerType, '2') && { tiled: true },
                        // If the layer is an overlay, mark it as so
                        ...strcmp(layerType, '2') && { isOverlay: true },
                        // If the layer is a base one, set the WMS version as 1.1.1
                        ...strcmp(layerType, '1') && { version: '1.1.1' },
                        // If the layer is an overlay, set the function for getting info about WMS features as a callback
                        ...strcmp(layerType, '2') && { callback: (params) => getFeatureInfo(params) }
                    }
                    const geoService = layerUrl || server
                    tileLayer = factory.tileLayer.extendedWMS(geoService, tileLayerOptions)
                } else if (strcmp(layerProtocol, 'tile')) {
                    const geoService = layerUrl || server
                    tileLayer = factory.tileLayer(geoService, {
                        maxZoom: 20,
                        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
                    })
                } else if (strcmp(layerProtocol, 'grid')) {
                    const url = layerUrl
                    // Check if the URL contains the word google
                    // If it does, we can get the layer type as a second part of (ex. google_terrain, means `terrain` is the layer type)
                    if (url?.includes('google')) {
                        tileLayer = factory.gridLayer.googleMutant({ maxZoom: 24, type: url.split('_')[1] })
                    }
                }
                // Set the basemap layers
                if (strcmp(layerType, '1')) {
                    if (!basemap[layerGroup]) {
                        basemap[layerGroup] = {}
                    }
                    Reflect.set(basemap[layerGroup], labelCode, tileLayer)
                    // Set the overlays
                } else if (strcmp(layerType, '2')) {
                    externalLayers.push(geoTypeLayer)
                    if (!overlays[layerGroup]) {
                        overlays[layerGroup] = {}
                    }
                    Reflect.set(overlays[layerGroup], labelCode, tileLayer)
                }
            })
        }
    }).catch(err => {
        console.error(err)
    }).finally(() => {
        layers.push(basemap, overlays)
        store.addState('listOfLayers', layers)
        store.addState('externalLayers', externalLayers)
        // Check if there are any basemap layers
        if (Object.values(basemap).length > 0) {
            // Check if the basemap layers object is not empty
            if (Object.values(Object.values(basemap)[0]).length > 0) {
                // Add the first basemap layer to the map
                Object.values(Object.values(basemap)[0])[0]?.addTo(Map)
            }
        }
    })
}

/**
 * Get the measurement unit according to the system param for it (MEASUREMENT_SYSTEM)
 * @param  {Boolean} isSquared Indicator for whether the unit needs to be squared
 */
export const getMeasurementUnit = (isSquared) => {
    let measurementUnit = 'm'
    let measurementUnitSquared = 'm²'
    const measurementSystemParam = window.measurementSystem
    if (measurementSystemParam) {
        if (strcmp(measurementSystemParam, 'imperial')) {
            if (isSquared) {
                measurementUnitSquared = 'ac'
            } else {
                measurementUnit = 'mi'
            }
        }
    }

    return isSquared ? measurementUnitSquared : measurementUnit
}

/**
 * Get the measurement system (metric, imperial etc.) according to the system param MEASUREMENT_SYSTEM
 */
export const getMeasurementSystem = () => {
    let measurementSystemObj = { metric: true, imperial: false }
    let measurementSystem = 'metric'

    if (window.measurementSystem) {
        if (strcmp(window.measurementSystem, 'imperial')) {
            measurementSystem = 'imperial'
        }
    }

    if (strcmp(measurementSystem, 'imperial')) {
        measurementSystemObj = { metric: false, imperial: true }
    }

    return measurementSystemObj
}
