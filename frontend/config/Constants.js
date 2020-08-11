/** @constant */
export const PROCESS_ENUM = {
    addPB: 'addPB',
}

/** @constant */
export const PB_DRAW = {
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
    // configuration of the resulting vector, after measurement finished. 
    pathOptions: {
        weight: 2.0,
        stroke: true,
        color: '#f8f8ff',
        fillColor: '#f8f8ff',
        opacity: 0.9,
        fillOpacity: 0.25,
        showMeasurements: true
    }
}

/** @constant */
export const PB_SCHEMA = {
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
            type: 'string'
        },
        NOTE: {
            maxLength: 2000,
            title: 'Забелешка',
            type: 'string'
        }
    },
    required: ['LAND_COVER_CODE'],
    'type': 'object',
}

/** @constant */
export const PB_UI_SCHEMA = {
    LAND_COVER_CODE: {
        /*'ui:placeholder': '200',*/
        /* classNames: 'form-control-sm'*/
    },
    NOTE: {
        'ui:widget': 'textarea',
        /*classNames: 'form-control-sm'*/
    }
}