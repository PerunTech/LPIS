/** @constant */
export const metadataMain = {
    type: 'agri_parcel',
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
            HOME_NAME: {
                maxLength: 2000,
                title: 'Локалитет',
                type: 'string',
                default: ''
            },
            NOTE_INSERT: {
                maxLength: 2000,
                title: 'Забелешка од оператор',
                type: 'string',
                default: ''
            },
            NOTE_FARMER: {
                maxLength: 2000,
                title: 'Забелешка од земјоделец',
                type: 'string',
                default: ''
            },
            NOTE_ORGANISATION: {
                maxLength: 2000,
                title: 'Забелешка од организација',
                type: 'string',
                default: ''
            },
        },
        required: ['LAND_COVER_CODE'],
        'type': 'object',
    },
    uiSchema: {
        LAND_COVER_CODE: { },
        /*HOME_NAME: { 'ui:widget': 'textarea' },*/
        NOTE_INSERT: { 'ui:widget': 'textarea' },
        NOTE_FARMER: { 'ui:widget': 'textarea' },
        NOTE_ORGANISATION: { 'ui:widget': 'textarea' }
    }
};

/** @constant */
export const metadataAux = {
    type: 'agri_parcel',
    namePath: 'options.metadata.schema.properties.LAND_COVER_CODE_2.default',
    schema: {
        properties: {
            LAND_COVER_CODE_2: {
                enum: [ '200', '210', '300', '310', '320', '400', '410', '420', '421', '422', '423', '430', '490', '500',
                    '600', '900' ],
                enumNames: ['Нива (обработливо земјиште)', 'Оранжерии и пластеници на обработливо земјиште',
                    'Постојан тревник', 'Ливада', 'Пасиште', 'Долгогодишни култури (траен насад)', 'Лозов насад',
                    'Овоштарник', 'Маслинов насад', 'Овошен насад', 'Јаткасто овошје', 'Растенија со брзо растечка маса',
                    'Мешани трајни насади', 'Различна искористеност на земјиштето', 'Матични насади',
                    'Останати типови на употреба на земјиштето' ],
                maxLength: 50,
                title: 'Секундарна употреба на земјиште',
                type: 'string',
                default: '200'
            },
            TERRACE: {
                title: 'Тераси',
                type: 'boolean',
                default: false
            },
            IRRIGATION: {
                title: 'Наводнување',
                type: 'boolean',
                default: false
            },
            LANDSCAPE_FEATURES: {
                title: 'Пејсажни карактеристики',
                type: 'boolean',
                default: false
            },
            INVISIBLE_BORDER: {
                title: 'Невидлива граница',
                type: 'boolean',
                default: false
            },
            CHANGED_BORDER: {
                title: 'Променета граница',
                type: 'boolean',
                default: false
            },
            EXP_AVG: {
                title: 'Експозиција',
                type: 'integer',
                minimum: 0,
                maximum: 999,
                default: 0
            },
            SLOPE_AVG: {
                title: 'Наклон',
                type: 'number',
                default: 0
            },
            Z_AVG: {
                title: 'Надморска височина',
                type: 'number',
                default: 0
            },

        },
        'type': 'object',
    },
    uiSchema: {
        LAND_COVER_CODE_2: { },
        EXP_AVG: { 'ui:widget': 'range' },
        INVISIBLE_BORDER: { 'ui:disabled': true },
        CHANGED_BORDER: { 'ui:disabled': true },
        SLOPE_AVG: { 'ui:disabled': true },
        Z_AVG: { 'ui:disabled': true },
    }
};

/** @constant */
export const metadataAdmin = {
    type: 'agri_parcel',
    namePath: 'options.metadata.schema.properties.LAND_COVER_CODE.default',
    schema: {
        properties: {
            ELIGIBILITY_COEF: {
                title: 'Коефициент на искористена површина',
                type: 'integer',
                minimum: 0,
                maximum: 100,
                default: 100
            },
            ORGANIC: {
                title: 'Органско производство',
                type: 'boolean',
                default: false
            },
            COMMON_USE: {
                title: 'Заедничка употреба',
                type: 'boolean',
                default: false
            },
            CERTIFICATE_OF_USE: {
                title: 'Право на користење',
                type: 'boolean',
                default: false
            },
            SOIL_TYPE: {
                title: 'Тип на почва',
                type: 'string',
                default: ''
            },
        },
        'type': 'object',
    },
    uiSchema: {
        ELIGIBILITY_COEF: { 'ui:widget': 'range' },
        COMMON_USE: { 'ui:disabled': true },
        CERTIFICATE_OF_USE: { 'ui:disabled': true },
        SOIL_TYPE: { 'ui:disabled': true },
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
        color: '#F6D800',
        fillColor: '#F6D800',
        opacity: 0.9,
        fillOpacity: 0.25,
        dashArray: [10, 10],
        showMeasurements: true
    },
    // the temporary line from the last drawn marker to the mouse cursor
    hintlineStyle: {
        weight: 2.0,
        stroke: true,
        color: '#F6D800',
        fillColor: '#F6D800',
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
        color: '#F6D800',
        fillColor: '#F6D800',
        opacity: 0.9,
        fillOpacity: 0.25,
        showMeasurements: true,
        metadata: { ...metadataMain, ...metadataAux, ...metadataAdmin }
    }
};

export const saveAP = {
    save_ap: {
        url: '/lpis/save/agriParcel/{init.token}/0',
        method: 'post',
        responseType: 'text',
        contentType: 'text'
    }
};