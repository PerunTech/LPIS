import { redux } from 'perun-core';
import { core, data } from '../Spatial';
import { setAPLabel } from '.';
import { config as apConfig } from './toolsBar/agriParcel/Config';

const { store: perunStore } = redux;
const { factory, store, http, Map } = core;
const { geobuf, protobuf } = data;

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

export const getFarmMapAssets = (fitBounds = false, token) => {
    const farmObjId = perunStore.getState().frmapData?.farmData?.["FARM.OBJECT_ID"]
    const url = `${window.server}/spatial/geometry/get/byparent/${token}/AGRI_PARCEL/${farmObjId}`

    http.call('getFarmMapAssets', { url, method: 'get', responseType: 'arraybuffer' }).then(response => {
        const data = geobuf.decode(protobuf(response));
        // filter data for type, set approp. config in factory.geoJSON
        const geojson = factory.geoJSON(data, apConfig);
        const layers = geojson.getLayers();

        //clear map of all vectors, reset state.
        const prevAgriParcels = store.getState().farmRegistry.agriParcels;
        Object.values(prevAgriParcels).forEach(v => v.removeFrom && v.removeFrom(Map));

        // send geojson to factory, visualize
        layers.forEach(layer => layer.addTo(Map));

        layers.forEach(layer => {
            const isDbo = Object.values(layer.getMetadata()).length > 0;
            if (isDbo && String(layer.getMetadata().type).toLowerCase() === 'agri_parcel') {
                setAPLabel(layer)
            }
        });

        // register in app state
        store.dispatch({ 'agriParcels': layers })
        fitBounds && Map.fitBounds(geojson.getBounds(), { padding: [100, 100] });
    }).catch(err => console.log(err));
};
