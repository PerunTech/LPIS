import { core } from '../../../Spatial';
import { getLabel } from '../../Util';
const { Map } = core;

/** @constant */
export const metadata = {
    type: 'physical_block',
    namePath: 'options.metadata.schema.properties.LAND_COVER_CODE.default',
    schema: {
        properties: {
            LAND_COVER_CODE: {
                enum: ['200', '210', '300', '310', '320', '400', '410', '420', '422', '423'],
                enumNames: [`${getLabel('farmland')}`, `${getLabel('greenhouse')}`, `${getLabel('lawn')}`, `${getLabel('meadow')}`, `${getLabel('pasture')}`,
                `${getLabel('permanent_cropland')}`, `${getLabel('vineyard')}`, `${getLabel('orchard')}`, `${getLabel('fruit_garden')}`, `${getLabel('nuts')}`],
                maxLength: 50,
                title: `${getLabel('land_use')}`,
                type: 'string',
                default: '200'
            },
            NOTE: {
                maxLength: 2000,
                title: `${getLabel('note')}`,
                type: 'string',
                default: ''
            }
        },
        required: ['LAND_COVER_CODE'],
        'type': 'object',
    },
    uiSchema: {
        LAND_COVER_CODE: {},
        NOTE: {
            'ui:widget': 'textarea'
        }
    }
};

/** @constant */
export const config = {
    // allow multiple drawn shapes
    repeatable: false,
    // snapping
    snappable: true,
    snapDistance: 20,
    // show tooltips
    tooltips: true,
    // allow snapping to the middle of segments
    snapMiddle: false,
    // self intersection
    allowSelfIntersection: true,
    // the vector that is currently being drawn (while measurement is active).
    templineStyle: {
        weight: 2.0,
        stroke: true,
        color: '#0b322f',
        fillColor: '#0b322f',
        opacity: 0.9,
        fillOpacity: 0.25,
        dashArray: [10, 10],
        showMeasurements: true
    },
    // the temporary line from the last drawn marker to the mouse cursor
    hintlineStyle: {
        weight: 2.0,
        stroke: true,
        color: '#0b322f',
        fillColor: '#0b322f',
        opacity: 0.9,
        fillOpacity: 0.25,
        dashArray: [10, 10],
    },
    // show a marker at the cursor
    cursorMarker: false,
    // specify type of layer event to finish the drawn shape
    // example events: 'mouseout', 'dblclick', 'contextmenu'
    finishOn: null,
    // configuration of the drawn vector. 
    pathOptions: {
        weight: 2.0,
        stroke: true,
        color: '#0b322f',
        fillColor: '#0b322f',
        opacity: 0.9,
        fillOpacity: 0.25,
        metadata
    }
};

export const setLoadedPhysicalBlockLabel = loadedPhysicalBlock => {
    const oldId = loadedPhysicalBlock.feature.properties.OLD_ID || '';
    const cnt = String(loadedPhysicalBlock.feature.properties.CENTROID);
    const latLng = Map.untransform(cnt.substring(cnt.indexOf('(') + 1, cnt.indexOf(')')).split(' ').map(s => Number(s)))

    loadedPhysicalBlock.bindTooltip(String(oldId), { direction: 'center', permanent: true });
    loadedPhysicalBlock.openTooltip(latLng);

    return loadedPhysicalBlock;
}

export const restPB = {
    save_pb: {
        url: '/lpis/save/physicalBlock/{init.token}/0',
        method: 'post',
        responseType: 'text',
        contentType: 'text'
    },
    render_pb: {
        url: '/spatial/getGeometry/bbox/{init.token}/PHYSICAL_BLOCK/{map.bbox}',
        method: 'get',
        responseType: 'arraybuffer',
    }
};