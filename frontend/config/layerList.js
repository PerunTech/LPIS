import { core } from "../Spatial";

const { factory, Map } = core
const geoService = window.server.substr(0, window.server.lastIndexOf('/'));


export const parcelLayersList = [{
    'Мапи и авионски снимки': {
        'Ортофото 2017 [380-740 nm]': factory.tileLayer.wms(
            'http://192.168.9.73:8070/geoserver/mkd/wms', {
            layers: 'mkd:VAGRI_PARCEL_WMS',
            format: 'image/png',
            transparent: true,
            tiled: true
        }
        ).addTo(Map)
    }
}];


export const layerList = [{
    'Мапи и авионски снимки': {
        'Ортофото 2017 [380-740 nm]': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'Macedonia_30cm',
            format: 'image/png',
            transparent: true,
            tiled: true
        }
        ).addTo(Map),

        'СИЗП': factory.tileLayer.wms(
            'http://192.168.9.73:8070/geoserver/mkd/wms', {
            layers: 'mkd:VAGRI_PARCEL_WMS',
            format: 'image/png',
            transparent: true,
            tiled: true
        }
        ).addTo(Map)
        ,

        'Ортофото 2017 [IR 700-1100 nm]': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'Macedonia_30cm_cir',   // Macedonia_30cm_cir
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
    },
    'Сателитски снимки - Битола': {
        'Битола_Е-29.07-F': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'nir_e_bitola',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
        'Битола_W1-29.07-F': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'nir_w1_bitola',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
        'Битола_W2-29.07-F': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'nir_w2_bitola',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
        'Битола_Е-29.07-T': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'rgb_e_bitola',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
        'Битола_W1-29.07-T': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'rgb_w1_bitola',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
        'Битола_W2-29.07-T': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'rgb_w2_bitola',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
    },
    'Сателитски снимки - Виница': {
        'Виница_Е-10.07-F': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'nir_vinica_3',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
        'Виница_W-10.07-F': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'nir_vinica_4',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
        'Виница_Е-10.07-Т': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'rgb_vinica_3',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
        'Виница_W-10.07-Т': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'rgb_vinica_4',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
    },
    'Сателитски снимки - Гевгелија': {
        'Гевгелија_E1-16.05-F': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'nir_gevgelija_1',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
        'Гевгелија_E2-16.05-F': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'nir_gevgelija_2',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
        'Гевгелија_W-19.05-F': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'nir_gevgelija_3',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
        'Гевгелија_E1-16.05-Т': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'rgb_gevgelija_1',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
        'Гевгелија_E2-16.05-Т': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'rgb_gevgelija_2',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
        'Гевгелија_W-19.05-Т': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'rgb_gevgelija_3',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
        'Гевгелија-20.09-F': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'nir_gevgelija_4',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
        'Гевгелија-20.09-T': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'rgb_gevgelija_4',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
    },
    'Сателитски снимки - Кавадарци': {
        'Кавадарци-28.06-F': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'nir_kavadarci',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
        'Кавадарци-28.06-Т': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'rgb_kavadarci',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
    },
    'Сателитски снимки - Куманово': {
        'Куманово_W-15.07-F': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'nir_kumanovo_1',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
        'Куманово_Е-15.07-F': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'nir_kumanovo_2',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
        'Куманово_W-15.07-Т': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'rgb_kumanovo_1',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),
        'Куманово_Е-15.07-Т': factory.tileLayer.wms(
            geoService + '/geoserver/mk/wms', {
            layers: 'rgb_kumanovo_2',
            format: 'image/png',
            transparent: true,
            tiled: true,
        }
        ),

    },
}, { /* overlays, tbd */ }];
