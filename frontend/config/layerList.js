import { core } from "../Spatial";

const { factory, Map } = core
const geoService = window.server.substr(0, window.server.lastIndexOf('/'));

export const layerList = [
    {
        'РАСТЕР': {
            'Орто фото 2017': factory.tileLayer.wms(
                geoService + '/geoserver/mk/wms', {
                layers: 'Macedonia_30cm',
                format: 'image/png',
                transparent: true,
                tiled: true
            }).addTo(Map),
            'Орто фото ИЦ 2017': factory.tileLayer.wms(
                geoService + '/geoserver/mk/wms', {
                layers: 'Macedonia_30cm_cir',
                format: 'image/png',
                transparent: true,
                tiled: true,
            })
        }
    },
    {
        'СИЗП': {
            'СИЗП': factory.tileLayer.wms(
                'http://192.168.9.73:8070' + '/geoserver/mkd/wms', {
                layers: 'mkd:VAGRI_PARCEL_WMS',
                format: 'image/png',
                transparent: true,
                tiled: true,
            }).addTo(Map)
        },
        'ДГУ': {
            'ТК 25': factory.tileLayer.wms(
                geoService + '/geoserver/mk/wms', {
                layers: 'mk:TK25',
                format: 'image/png',
                transparent: true,
                tiled: true,
            }),
            'Државни граници': factory.tileLayer.wms(
                geoService + '/geoserver/mk/wms', {
                layers: 'mk:boundary',
                format: 'image/png',
                transparent: true,
                tiled: true,
            }),
            'Општини': factory.tileLayer.wms(
                geoService + '/geoserver/mk/wms', {
                layers: 'mk:Admin_Border_polygon',
                format: 'image/png',
                transparent: true,
                tiled: true,
            })
        },
        'Иницијални податоци': {
            'Иницијален СИЗП (ажуриран)': factory.tileLayer.wms(
                'http://192.168.9.73:8070' + '/geoserver/mkd/wms', {
                layers: 'mkd:VPHYSICAL_BLOCK_WMS2',
                format: 'image/png',
                transparent: true,
                tiled: true,
            }),
            'Референтна парцела (РП)': factory.tileLayer.wms(
                geoService + '/geoserver/mk/wms', {
                layers: 'mk:RP',
                format: 'image/png',
                transparent: true,
                tiled: true,
            })
        },
        'Катастарски податоци': {
            'СИЗП КП пресек': factory.tileLayer.wms(
                geoService + '/geoserver/mk/wms', {
                layers: 'mk:ALP_CAD_INTERSECTIONS',
                format: 'image/png',
                transparent: true,
                tiled: true,
            })
        },
        'Води': {
            'Линии': factory.tileLayer.wms(
                geoService + '/geoserver/mk/wms', {
                layers: 'mk:WF_LINES',
                format: 'image/png',
                transparent: true,
                tiled: true,
            })
        },
        'Високопланински пасишта': {
            'Високопланински пасишта (полигони)': factory.tileLayer.wms(
                geoService + '/geoserver/mk/wms', {
                layers: 'mk:HIGHLAND_PASTURES_FINAL_ALL',
                format: 'image/png',
                transparent: true,
                tiled: true,
            })
        },
        'Патна мрежа (податоци од AREC)': {
            'Патишта': factory.tileLayer.wms(
                geoService + '/geoserver/mk/wms', {
                layers: 'mk:roadn_RM',
                format: 'image/png',
                transparent: true,
                tiled: true,
            })
        },
        'Почвена карта': {
            'Почвени типови': factory.tileLayer.wms(
                geoService + '/geoserver/mk/wms', {
                layers: 'mk:PocveniTipovi',
                format: 'image/png',
                transparent: true,
                tiled: true,
            }),
            'Почвени профили': factory.tileLayer.wms(
                geoService + '/geoserver/mk/wms', {
                layers: 'mk:Agropedology_Profili',
                format: 'image/png',
                transparent: true,
                tiled: true,
            })
        },
        'Заштитено подрачје': {
            'ЗПП': factory.tileLayer.wms(
                geoService + '/geoserver/mk/wms', {
                layers: 'mk:NATURE_PROTECTED_AREAS',
                format: 'image/png',
                transparent: true,
                tiled: true,
            })
        },
        'Системи за наводнување и одводнување': {
            'Главни канали': factory.tileLayer.wms(
                geoService + '/geoserver/mk/wms', {
                layers: 'mk:glavnikanali',
                format: 'image/png',
                transparent: true,
                tiled: true,
            }),
            'Споредни канали': factory.tileLayer.wms(
                geoService + '/geoserver/mk/wms', {
                layers: 'mk:sporednikanali',
                format: 'image/png',
                transparent: true,
                tiled: true,
            }),
            'Главни цевководи': factory.tileLayer.wms(
                geoService + '/geoserver/mk/wms', {
                layers: 'mk:glavnicevkovodi',
                format: 'image/png',
                transparent: true,
                tiled: true,
            }),
            'Споредни цевководи': factory.tileLayer.wms(
                geoService + '/geoserver/mk/wms', {
                layers: 'mk:sporednicevkovodi',
                format: 'image/png',
                transparent: true,
                tiled: true,
            })
        },
        'Податоци од земјишна покривка': {
            'Земјишна покривка': factory.tileLayer.wms(
                geoService + '/geoserver/mk/wms', {
                layers: 'mk:LAND_COVERS',
                format: 'image/png',
                transparent: true,
                tiled: true,
            })
        }
    }
];
