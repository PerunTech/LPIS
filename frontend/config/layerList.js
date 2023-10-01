import { core } from "../Spatial";

const { factory, Map } = core
// const geoService = window.server.substr(0, window.server.lastIndexOf('/'));

export const layerList = [
    {
        'Moldova Raster': {
            'Moldova': factory.tileLayer.wms(
                'https://map.cadastru.md' + '/geoserver/w_rsuat/wms', {
                layers: 'w_rsuat:mv_uat1',
                format: 'image/png',
                transparent: true,
                tiled: true,
                tilesOrigin: '67617.8034,36597.0212'
            }).addTo(Map)
        }
    },
    {}
]
