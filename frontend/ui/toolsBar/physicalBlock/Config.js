/** @constant */
export const metadata = {
    type: 'physical_block',
    namePath: 'options.metadata.schema.properties.LAND_COVER_CODE.default',
    schema: {
        properties: {
            LAND_COVER_CODE: {
                enum: [ '200', '210', '300', '310', '320', '400', '410', '420', '421', '422', '423', '430', '490', '500',
                    '600', '900' ],
                enumNames: ['Нива (обработливо земјиште)', 'Оранжерии и пластеници на обработливо земјиште',
                    'Постојан тревник', 'Ливада', 'Пасиште', 'Долгогодишни култури (траен насад)', 'Лозов насад',
                    'Овоштарник', 'Маслинов насад', 'Овошен насад', 'Јаткасто овошје', 'Растенија со брзо растечка маса',
                    'Мешани трајни насади', 'Различна искористеност на земјиштето', 'Матични насади',
                    'Останати типови на употреба на земјиштето' ],
                maxLength: 50,
                title: 'Употреба на земјиште',
                type: 'string',
                default: '200'
            },
            NOTE: {
                maxLength: 2000,
                title: 'Забелешка',
                type: 'string',
                default: ''
            }
        },
        required: ['LAND_COVER_CODE'],
        'type': 'object',
    },
    uiSchema: {
        LAND_COVER_CODE: { },
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
        color: '#f8f8ff',
        fillColor: '#f8f8ff',
        opacity: 0.9,
        fillOpacity: 0.25,
        dashArray: [10, 10],
        showMeasurements: true
    },
    // the temporary line from the last drawn marker to the mouse cursor
    hintlineStyle: {
        weight: 2.0,
        stroke: true,
        color: '#f8f8ff',
        fillColor: '#f8f8ff',
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
        color: '#f8f8ff',
        fillColor: '#f8f8ff',
        opacity: 0.9,
        fillOpacity: 0.25,
        showMeasurements: true,
        metadata
    }
};

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