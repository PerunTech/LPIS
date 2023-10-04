import { core } from "../Spatial";

const { factory, Map } = core

export const layerList = [
    {
        'Orthophoto base map': {
            'Ortofoto 2016': factory.tileLayer.wms(
                'https://geodata.gov.md' + '/geoserver/orthophoto/wms', {
                version: '1.3.0',
                layers: 'orthophoto:Ortofoto_2016_RM',
                format: 'image/png',
                transparent: true,
            }),
            'Ortofoto 2020': factory.tileLayer.wms(
                'https://geodata.gov.md' + '/geoserver/orthophoto/wms', {
                version: '1.3.0',
                layers: 'orthophoto:2020_ortofoto_moldova_centru',
                format: 'image/png',
                transparent: true,
            }),
            'Ortofoto 2021': factory.tileLayer.wms(
                'https://geodata.gov.md' + '/geoserver/orthophoto/wms', {
                version: '1.3.0',
                layers: 'orthophoto:2021_ortofoto_moldova_sud',
                format: 'image/png',
                transparent: true,
            }).addTo(Map)
        }
    },
    {
        'Moldova Cadastre': {
            'UAT 2 (w_rsuat:mv_uat1)': factory.tileLayer.wms(
                'https://map.cadastru.md' + '/geoserver/w_rsuat/wms', {
                layers: 'w_rsuat:mv_uat1',
                format: 'image/png',
                transparent: true,
                tiled: true,
                tilesOrigin: '67617.8034,36597.0212'
            }),
            'UAT 1 (w_rsuat:mv_uat3)': factory.tileLayer.wms(
                'https://map.cadastru.md' + '/geoserver/w_rsuat/wms', {
                layers: 'w_rsuat:mv_uat3',
                format: 'image/png',
                transparent: true,
                tiled: true,
                tilesOrigin: '67617.8034,36597.0212'
            }),
            'Registrul Bunurilor Imobile (straturi grupate)': factory.tileLayer.wms(
                'https://map.cadastru.md' + '/geoserver/w_rsuat/wms', {
                layers: 'w_cbi:cbi_layers_all_in_one',
                format: 'image/png',
                transparent: true,
                tiled: true,
                tilesOrigin: '67617.8034,36597.0212'
            }),
            'Localitate': factory.tileLayer.wms(
                'https://map.cadastru.md' + '/geoserver/w_rsuat/wms', {
                layers: 'w_rsuat:mv_localitate',
                format: 'image/png',
                transparent: true,
                tiled: true,
                tilesOrigin: '67617.8034,36597.0212'
            })
        }
    }
]
