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
            enum: [ '423', '400', '310', '410', '421', '600', '490', '200', '422',
                '420', '210', '900', '320', '300', '500', '430'],
            enumNames: ['Јаткасто овошје', 'Долгогодишни култури (траен насад)', 'Ливада', 'Лозов насад',
                'Маслинов насад', 'Матични насади', 'Мешани трајни насади', 'Нива (обработливо земјиште)',
                'Овошен насад', 'Овоштарник', 'Оранжерии и пластеници на обработливо земјиште',
                'Останати типови на употреба на земјиштето', 'Пасиште', 'Постојан тревник',
                'Различна искористеност на земјиштето', 'Растенија со брзо растечка маса' ],
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