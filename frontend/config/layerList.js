import { core } from "../Spatial";

const { factory, Map } = core

export const layerList = [
    {
        'Moldova UAT': {
            'UAT 2 (w_rsuat:mv_uat1)': factory.tileLayer.wms(
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
