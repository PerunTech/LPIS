/** @constant */
export const restAP = {
    check_ap: {
        url: '/lpis/check/PBContainsAP/{init.token}',
        method: 'post',
    },
    save_ap: {
        url: '/lpis/save/agriParcel/{init.token}/0/0',
        method: 'post',
        responseType: 'arraybuffer'
    },
    create_ap: {
        url: '/spatial/geometry/layer/cutoff/{init.token}/PHYSICAL_BLOCK/AGRI_PARCEL/0/0',
        method: 'get',
        responseType: 'arraybuffer'
    },
    splitAP: {
        url: '/spatial/geometry/split/preview/{init.token}/AGRI_PARCEL/""',
        method: 'post',
        responseType: 'arraybuffer'
    },
    mergeAP: {
        url: '/spatial/geometry/merge/confirm/{init.token}/AGRI_PARCEL/""',
        method: 'post',
        responseType: 'arraybuffer'
    },
    cutAP: {
        url: '/spatial/geometry/hole/{init.token}/AGRI_PARCEL/""',
        method: 'post',
        responseType: 'arraybuffer'
    },
    fillAP: {
        url: '/spatial/geometry/fill/{init.token}/AGRI_PARCEL/""',
        method: 'post',
        responseType: 'arraybuffer'
    }
};

export const saveAPFormSchema = (pbCheck, apCheck, neighbourCheck, intersectedNeighbours, skipNeighbourCheck) => {
    let apCheckDescriptionLabel = ''
    if (intersectedNeighbours) {
        const neighbourIds = intersectedNeighbours
        const splitIds = neighbourIds.split(',')?.filter(neighbourId => neighbourId)
        if (splitIds && Array.isArray(splitIds) && splitIds.length > 0) {
            splitIds.forEach((id, i) => {
                if (id) {
                    const splitId = id?.split(':')
                    if (splitId && Array.isArray(splitId) && splitId.length > 0) {
                        const parcelId = splitId[0]
                        const comma = i !== splitIds.length - 1 ? ',' : ''
                        apCheckDescriptionLabel += `${parcelId}${comma}`
                    }
                }
            })
        }
    }

    return {
        schema: {
            type: 'object',
            properties: {
                ...pbCheck ? {
                    physical_block_check: {
                        title: 'Земјоделската парцела не е комплетно опфатена од еден и единствен физички блок',
                        type: 'string',
                        enum: ['0', '1'],
                        enumNames: [
                            'Отсечи ја земјоделската парцела според границите на физичкиот блок',
                            'Задржи ја просторната определба (системот ќе покрене барање за контрола на терен)'
                        ],
                        default: '0'
                    }
                } : {
                    physical_block_check: {
                        title: 'Земјоделската парцела е комплетно опфатена од еден физички блок',
                        type: 'string'
                    }
                },
                ...apCheck ? {
                    agri_parcel_check: {
                        title: 'Земјоделската парцела се пресекува со соседните земјоделски парцели',
                        type: 'string',
                        enum: ['0', '1'],
                        enumNames: [
                            'Отсечи ја работната земјоделската парцела според границите на соседните земјоделски парцели',
                            'Задржи ја просторната определба (системот ќе покрене барање за контрола на терен)'
                        ],
                        default: '0'
                    }
                } : {
                    agri_parcel_check: {
                        title: 'Земјоделската парцела не се пресекува со соседните земјоделски парцели',
                        type: 'string',
                    }
                },
                ...neighbourCheck ? {
                    agri_parcel_neighbour: {
                        title: 'Соседните парцели не се прилепени или оддалечени повеќе од 1 метар',
                        description: `Соседни парцели кои не се прецизно прилепени: ${apCheckDescriptionLabel}`,
                        type: 'string',
                        enum: ['0', '1'],
                        enumNames: ['Прилепи до соседна парцела', 'Остави простор помеѓу парцелите'],
                        default: '0'
                    }
                } : !skipNeighbourCheck && {
                    agri_parcel_neighbour: {
                        title: 'Соседните парцели се прилепени или оддалечени повеќе од 1 метар',
                        type: 'string',
                    }
                }
            }
        },
        uiSchema: {
            ...pbCheck ? {
                physical_block_check: {
                    'ui:widget': 'radio'
                }
            } : {
                physical_block_check: {
                    'classNames': 'success-pre-save-check'
                }
            },
            ...apCheck ? {
                agri_parcel_check: {
                    'ui:widget': 'radio'
                }
            } : {
                agri_parcel_check: {
                    'classNames': 'success-pre-save-check'
                }
            },
            ...neighbourCheck ? {
                agri_parcel_neighbour: {
                    'ui:widget': 'radio'
                }
            } : {
                agri_parcel_neighbour: {
                    'classNames': 'success-pre-save-check'
                }
            }
        }
    }
}

/** @constant */
export const metadataMain = {
    type: 'agri_parcel',
    namePath: 'options.metadata.schema.properties.parent_id',
    schema: {
        properties: {
            LAND_COVER_CODE: {
                enum: ['200', '210', '310', '320', '400', '410', '420', '421', '422', '423', '430', '490', '500',
                    '600', '900'],
                enumNames: ['Нива (обработливо земјиште)', 'Оранжерии и пластеници на обработливо земјиште',
                    'Ливада', 'Пасиште', 'Долгогодишни култури (траен насад)', 'Лозов насад',
                    'Овоштарник', 'Маслинов насад', 'Овошен насад', 'Јаткасто овошје', 'Растенија со брзо растечка маса',
                    'Мешани трајни насади', 'Различна искористеност на земјиштето', 'Матични насади',
                    'Останати типови на употреба на земјиштето'],
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
        LAND_COVER_CODE: {},
        /*HOME_NAME: { 'ui:widget': 'textarea' },*/
        NOTE_INSERT: { 'ui:widget': 'textarea' },
        NOTE_FARMER: { 'ui:widget': 'textarea' },
        NOTE_ORGANISATION: { 'ui:widget': 'textarea' }
    }
};

/** @constant */
export const metadataAux = {
    type: 'agri_parcel',
    namePath: 'options.metadata.schema.properties.parent_id',
    schema: {
        properties: {
            LAND_COVER_CODE_2: {
                enum: ['0', '200', '210', '310', '320', '400', '410', '420', '421', '422', '423', '430', '490', '500',
                    '600', '900'],
                enumNames: [' ', 'Нива (обработливо земјиште)', 'Оранжерии и пластеници на обработливо земјиште',
                    'Ливада', 'Пасиште', 'Долгогодишни култури (траен насад)', 'Лозов насад',
                    'Овоштарник', 'Маслинов насад', 'Овошен насад', 'Јаткасто овошје', 'Растенија со брзо растечка маса',
                    'Мешани трајни насади', 'Различна искористеност на земјиштето', 'Матични насади',
                    'Останати типови на употреба на земјиштето'],
                maxLength: 50,
                title: 'Секундарна употреба на земјиште',
                type: 'string',
                default: '0'
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
                title: 'Пејсажни обележја',
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
            EXPOSITION_AVG: {
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
                type: 'string',
                default: '0'
            },

        },
        'type': 'object',
    },
    uiSchema: {
        LAND_COVER_CODE_2: {},
        EXPOSITION_AVG: { 'ui:widget': 'range', 'ui:disabled': true },
        SLOPE_AVG: { 'ui:disabled': true },
        Z_AVG: { 'ui:disabled': true },
    }
};

/** @constant */
export const metadataAdmin = {
    type: 'agri_parcel',
    namePath: 'options.metadata.schema.properties.parent_id',
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
        // CERTIFICATE_OF_USE: { 'ui:disabled': true },
        SOIL_TYPE: { 'ui:disabled': true },
    }
};

export const commonUseSchema = {
    type: 'agri_parcel',
    namePath: 'options.metadata.schema.properties.parent_id',
    schema: {
        properties: {
            commonUseType: {
                type: 'string',
                title: 'Одбери тип на дел:',
                enum: ['CLAIMED_AREA', 'CLAIMED_RATIO'],
                enumNames: ['Површина', 'Идеален дел'],
                default: 'CLAIMED_AREA'
            },
            value: {
                type: 'string',
                title: 'Вредност'
            }
        },
        type: 'object',
        required: ['commonUseType', 'value']
    },
    uiSchema: {
        commonUseType: {
            'ui:widget': 'radio',
            'ui:options': { inline: true }
        }
    }
};

export const permanentCropSchema = {
    namePath: 'options.metadata.schema.properties.parent_id',
    schema: {
        properties: {
            PERM_CROP_TYPE_ID: {
                enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10',],
                enumNames: [
                    'Лозје - Шардоне', 'Лозје - Жилавка', 'Лозје - Жупљанка', 'Лозје - Жупски бојадисер', 'Лозје - Афус али',
                    'Лозје - Агадај', 'Лозје - Аликант буше', 'Лозје - Беглерка бела', 'Лозје - Беглерка црна', 'Лозје - Белан',
                ],
                title: 'Вид на земјоделска култура',
                type: 'string',
                default: ''
            },
            PLANT_AREA: {
                title: 'Површина со засадена култура',
                type: 'string',
                default: ''
            },
            NUMBER_OF_TREES: {
                title: 'Број на садници',
                type: 'string',
                default: ''
            },
            YEAR_OF_PLANTING_TREES: {
                title: 'Година на садење',
                type: 'string',
                default: ''
            },
            TREES_DISTANCE: {
                title: 'Растојание помеѓу садници (cm.)',
                type: 'string',
                default: ''
            },
            TREES_ROW_DISTANCE: {
                title: 'Растојание помеѓу редови (cm.)',
                type: 'string',
                default: ''
            }
        },
        type: 'object',
        required: ['PERM_CROP_TYPE_ID', 'PLANT_AREA', 'NUMBER_OF_TREES']
    }
}

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
    cursorMarker: true,
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
        /* showMeasurements: true, */
        metadata: {
            type: 'agri_parcel',
            namePath: 'feature.properties.parent_id',
            schema: {
                'type': 'object',
                'properties': {
                    ...metadataMain.schema.properties,
                    ...metadataAux.schema.properties,
                    ...metadataAdmin.schema.properties
                }
            },
            uiSchema: {
                ...metadataMain.uiSchema,
                ...metadataAux.uiSchema,
                ...metadataAdmin.uiSchema
            }
        }
    }
};

/** @constant */
export const cutConfig = {
    templineStyle: {
        weight: 2.0,
        stroke: true,
        color: '#dc3545',
        fillColor: '#dc3545',
        opacity: 0.9,
        fillOpacity: 0.25,
        dashArray: [10, 10],
        showMeasurements: true
    },
    hintlineStyle: {
        weight: 2.0,
        stroke: true,
        color: '#dc3545',
        fillColor: '#dc3545',
        opacity: 0.9,
        fillOpacity: 0.25,
        dashArray: [10, 10],
    },
    pathOptions: {
        weight: 2.0,
        stroke: true,
        color: '#dc3545',
        fillColor: '#dc3545',
        opacity: 0.9,
        fillOpacity: 0.25,
        showMeasurements: true,
        metadata: {
            type: 'agri_parcel',
            namePath: 'options.metadata.schema.properties.PARENT_ID',
            schema: {
                'type': 'object',
                'properties': {
                    ...metadataMain.schema.properties,
                    ...metadataAux.schema.properties,
                    ...metadataAdmin.schema.properties
                }
            },
            uiSchema: {
                ...metadataMain.uiSchema,
                ...metadataAux.uiSchema,
                ...metadataAdmin.uiSchema
            }
        }
    }
};

export const fillConfig = {
    templineStyle: {
        weight: 2.0,
        stroke: true,
        color: '#04458F',
        fillColor: '#04458F',
        opacity: 0.9,
        fillOpacity: 0.25,
        dashArray: [10, 10],
        showMeasurements: true
    },
    // the temporary line from the last drawn marker to the mouse cursor
    hintlineStyle: {
        weight: 2.0,
        stroke: true,
        color: '#04458F',
        fillColor: '#04458F',
        opacity: 0.9,
        fillOpacity: 0.25,
        dashArray: [10, 10],
    },
    pathOptions: {
        weight: 2.0,
        stroke: true,
        color: '#04458F',
        fillColor: '#04458F',
        opacity: 0.9,
        fillOpacity: 0.25,
        showMeasurements: true,
        metadata: {
            type: 'agri_parcel',
            namePath: 'options.metadata.schema.properties.PARENT_ID',
            schema: {
                'type': 'object',
                'properties': {
                    ...metadataMain.schema.properties,
                    ...metadataAux.schema.properties,
                    ...metadataAdmin.schema.properties
                }
            },
            uiSchema: {
                ...metadataMain.uiSchema,
                ...metadataAux.uiSchema,
                ...metadataAdmin.uiSchema
            }
        }
    }
}

export const cadIntersectionsConfig = {
    pathOptions: {
        weight: 2.0,
        stroke: true,
        color: '#E09A29',
        fillColor: '#E09A29',
        opacity: 0.9,
        fillOpacity: 0.25,
        metadata: {
            type: 'agri_parcel',
            namePath: 'options.metadata.schema.properties.PARENT_ID',
            schema: {
                'type': 'object',
                'properties': {
                    ...metadataMain.schema.properties,
                    ...metadataAux.schema.properties,
                    ...metadataAdmin.schema.properties
                }
            },
            uiSchema: {
                ...metadataMain.uiSchema,
                ...metadataAux.uiSchema,
                ...metadataAdmin.uiSchema
            }
        }
    }
}

export const parcelHistoryConfig = {
    pathOptions: {
        weight: 2.0,
        stroke: true,
        color: '#000000',
        fillColor: '#000000',
        opacity: 0.9,
        fillOpacity: 0.25,
        metadata: {
            type: 'agri_parcel',
            namePath: 'options.metadata.schema.properties.PARENT_ID',
            schema: {
                'type': 'object',
                'properties': {
                    ...metadataMain.schema.properties,
                    ...metadataAux.schema.properties,
                    ...metadataAdmin.schema.properties
                }
            },
            uiSchema: {
                ...metadataMain.uiSchema,
                ...metadataAux.uiSchema,
                ...metadataAdmin.uiSchema
            }
        }
    }
}

export const createAPMsg = [
    'Оберете слободен физички блок за да додадете земјоделска парцела.',
    '1. Притиснете на левото копче од глувчето врз физичкиот блок за да направите избор.',
    '2. Земјоделската парцела ќе се исцрта според границите на избраниот блок.',
    '3. Одбраната локација мора да припаѓа во границите на активен физичкиот блок.',
    '4. Одбраната локација не смее да се преклопува со површината на друга земјоделска парцела.'
];

export const editAPMsg = [
    'Одберете земјоделска парцела на мапата која сакате да ја промените.',
    '1. Притиснете на левото копче од глувчето врз земјоделската парцела за да направите избор.',
    '2. Земјоделската парцела ќе се исцрта според нејзините граници.'
];

export const deleteAPMsg = [
    'Одберете земјоделска парцела на мапата која ќе се избрише од базата на податоци.',
    '1. Изборот се прави со притискање на левото копче од глувчето врз земјоделската парцела.',
    '2. Одеднаш може да биде избришана само една земјоделска парцела.',
]

export const deleteAPFromFarmMsg = [
    'Одберете земјоделска парцела на мапата која ќе се отстрани од моменталната фарма.',
    '1. Изборот се прави со притискање на левото копче од глувчето врз земјоделската парцела.',
    '2. Одеднаш може да биде отстранета само една земјоделска парцела.',
]

export const assignAPMsg = [
    'Одберете земјоделска парцела на мапата на која сакате да додадете земјоделско стопанство.',
    '1. Изборот се прави со притискање на левото копче од глувчето врз земјоделската парцела.',
    '2. Истовремено може да се додели земјоделско стопанство на само една парцела.',
]

export const drawAPMsg = [
    'Алатката за исцртување на земјоделска парцела е активна.',
    '1. Започнете со поставување на првото теме од парцелата, со притискање на левото копче од глувчето на саканата локација на мапата.',
    '2. Продолжете со поставување на темиња според теренот прикажан на мапата.',
    '3. За крај на цртањето и комплетирање на парцелата, притиснете врз првото поставено теме.',
    '4. Полигонот мора да има најмалку три (3) темиња.',
    '5. Полигонот мора да биде затворен.',
    '6. Полигонот не смее да се сече сам со себе.',
];

export const splitAPMsg = [
    'Алатката за поделба на земјоделска парцела е активна.',
    '1. Кликнете на делот од парцелата кој ќе се задржи по поделбата',
    '2. Исцртајте ја линијата каде ќе биде поделена парцелата'
]

export const commonUseMsg = [
    'Одберете земјоделска парцела на мапата за која сакате да додадете или промените податоци за заедничка употреба.',
    '1. Притиснете на левото копче од глувчето врз земјоделската парцела за да направите избор.',
    '2. Ќе добиете информации за заедничка употреба за избраната парцела, ако истите постојат.'
]

export const permanentCropsMsg = [
    'Одберете земјоделска парцела на мапата за која сакате да додадете или промените информации за долгогодишни култури.'
]

export const parcelInfoMsg = [
    'Одберете земјоделска парцела на мапата за која сакате да добиете повеќе информации.'
]

export const copyAPMsg = [
    'Одберете земјоделска парцела на мапата која сакате да ја копирате.'
]

export const calculateCadIntersectionsMsg = [
    'Во тек е процесот за пресметатување на пресеци.'
]

export const loadParcelMsg = [
    'Одберете земјоделска парцела на мапата која сакате да биде вчитана.'
]

export const cutAPMsg = [
    'Алатката за отсекување на земјоделска парцела е активна.',
    ''
]

export const fillAPMsg = [
    'Алатката за пополнување на земјоделска парцела е активна.',
    ''
]

export const mergeAPMsg = [
    'Алатката за спојување на земјоделска парцела е активна.',
    ''
]