import { getLabel } from '../../Util';

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

export const saveAPFormSchema = (pbCheck, apCheck, neighbourCheck, intersectedNeighbours) => {
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
                        title: `${getLabel('physical_block_check_true')}`,
                        type: 'string',
                        enum: ['0', '1'],
                        enumNames: [
                            `${getLabel('physical_block_check_selection_one')}`,
                            `${getLabel('physical_block_check_selection_two')}`
                        ],
                        default: '0'
                    }
                } : {
                    physical_block_check: {
                        title: `${getLabel('physical_block_check_false')}`,
                        type: 'string'
                    }
                },
                ...apCheck ? {
                    agri_parcel_check: {
                        title: `${getLabel('agri_parcel_check_true')}`,
                        type: 'string',
                        enum: ['0', '1'],
                        enumNames: [
                            `${getLabel('agri_parcel_check_selection_one')}`,
                            `${getLabel('agri_parcel_check_selection_two')}`
                        ],
                        default: '0'
                    }
                } : {
                    agri_parcel_check: {
                        title: `${getLabel('agri_parcel_check_false')}`,
                        type: 'string',
                    }
                },
                ...neighbourCheck ? {
                    agri_parcel_neighbour: {
                        title: `${getLabel('agri_parcel_neighbour_true')}`,
                        description: `${getLabel('agri_parcel_neighbour_check_label')}: ${apCheckDescriptionLabel}`,
                        type: 'string',
                        enum: ['0', '1', '2'],
                        enumNames: [
                            `${getLabel('agri_parcel_neighbour_selection_one')}`,
                            `${getLabel('agri_parcel_neighbour_selection_two')}`,
                            `${getLabel('agri_parcel_neighbour_selection_three')}`
                        ],
                        default: '0'
                    }
                } : {
                    agri_parcel_neighbour: {
                        title: `${getLabel('agri_parcel_neighbour_false')}`,
                        type: 'string',
                    }
                }
            }
        },
        uiSchema: {
            ...pbCheck ? {
                physical_block_check: {
                    'ui:widget': 'radio',
                    'classNames': 'physical-block-check'
                }
            } : {
                physical_block_check: {
                    'classNames': 'success-pre-save-check'
                }
            },
            ...apCheck ? {
                agri_parcel_check: {
                    'ui:widget': 'radio',
                    'classNames': 'agri-parcel-check'
                }
            } : {
                agri_parcel_check: {
                    'classNames': 'success-pre-save-check'
                }
            },
            ...neighbourCheck ? {
                agri_parcel_neighbour: {
                    'ui:widget': 'radio',
                    'classNames': 'agri-parcel-neighbour-check'
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
            OLD_ID: {
                title: `${getLabel('lpis_number')}`,
                type: 'integer',
                default: 0
            },
            LAND_COVER_CODE: {
                enum: ['200', '210', '310', '320', '410', '421', '422', '423', '430', '490', '600', '900'],
                enumNames: [
                    `${getLabel('farmland')}`,
                    `${getLabel('greenhouse')}`,
                    `${getLabel('lawn')}`,
                    `${getLabel('pasture')}`,
                    `${getLabel('vineyard')}`,
                    `${getLabel('olive_grove')}`,
                    `${getLabel('orchard')}`,
                    `${getLabel('nuts')}`,
                    `${getLabel('fast_growing_plants')}`,
                    `${getLabel('mixed_permanent_crops')}`,
                    `${getLabel('stem_plants')}`,
                    `${getLabel('temporarily_uncultivated_land')}`
                ],
                maxLength: 50,
                title: `${getLabel('land_use')}`,
                type: 'string',
                default: '200'
            },
            LAND_COVER_CODE_2: {
                enum: ['0', '410', '421', '422', '423'],
                enumNames: [' ', `${getLabel('vineyard')}`, `${getLabel('olive_grove')}`, `${getLabel('orchard')}`, `${getLabel('nuts')}`],
                maxLength: 50,
                title: `${getLabel('dominant_land_use')}`,
                type: 'string',
                default: '0'
            },
            HOME_NAME: {
                maxLength: 2000,
                title: `${getLabel('locality')}`,
                type: 'string',
                default: ''
            },
            NOTE_INSERT: {
                maxLength: 2000,
                title: `${getLabel('note')}`,
                type: 'string',
                default: ''
            },
            NOTE_FARMER: {
                maxLength: 2000,
                title: `${getLabel('farmer_note')}`,
                type: 'string',
                default: ''
            },
            NOTE_ORGANISATION: {
                maxLength: 2000,
                title: `${getLabel('organization_note')}`,
                type: 'string',
                default: ''
            },
        },
        required: ['LAND_COVER_CODE'],
        type: 'object',
    },
    uiSchema: {
        OLD_ID: { 'ui:disabled': true },
        LAND_COVER_CODE: {},
        LAND_COVER_CODE_2: { 'ui:disabled': true },
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
            CHANGED_BORDER: {
                title: `${getLabel('changed_border')}`,
                type: 'boolean',
                default: false
            },
            LANDSCAPE_FEATURES: {
                title: `${getLabel('landscape_features')}`,
                type: 'boolean',
                default: false
            },
            TERRACE: {
                title: `${getLabel('terrace')}`,
                type: 'boolean',
                default: false
            },
            INVISIBLE_BORDER: {
                title: `${getLabel('invisible_border')}`,
                type: 'boolean',
                default: false
            },
            IRRIGATION: {
                title: `${getLabel('irrigation')}`,
                type: 'boolean',
                default: false
            },
            ELIGIBILITY_COEF: {
                title: `${getLabel('eligibility_coef')}`,
                type: 'integer',
                enum: [25, 50, 75, 100],
                enumNames: ['25%', '50%', '75%', '100%'],
                default: 100,
            },
        },
        'type': 'object',
    },
    uiSchema: {
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
            EXPOSITION_AVG: {
                title: `${getLabel('exposition_avg')}`,
                type: 'integer',
                minimum: 0,
                maximum: 999,
                default: 0
            },
            SLOPE_AVG: {
                title: `${getLabel('slope_avg')}`,
                type: 'number',
                default: 0
            },
            Z_AVG: {
                title: `${getLabel('z_avg')}`,
                type: 'string',
                default: '0'
            },
            ORGANIC: {
                title: `${getLabel('organic')}`,
                type: 'boolean',
                default: false
            },
            COMMON_USE: {
                title: `${getLabel('common_use')}`,
                type: 'boolean',
                default: false
            },
            CERTIFICATE_OF_USE: {
                title: `${getLabel('certificate_of_use')}`,
                type: 'boolean',
                default: false
            },
            SOIL_TYPE: {
                title: `${getLabel('soil_type')}`,
                type: 'string',
                default: ''
            },
        },
        type: 'object',
    },
    uiSchema: {
        EXPOSITION_AVG: { 'ui:widget': 'range', 'ui:disabled': true },
        COMMON_USE: { 'ui:disabled': true },
        SOIL_TYPE: { 'ui:disabled': true },
    }
};

export const permanentCropSchema = {
    namePath: 'options.metadata.schema.properties.parent_id',
    schema: {
        properties: {
            PERM_CROP_TYPE_ID: {
                enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10',],
                enumNames: [
                    `${getLabel('vineyard.chardonnay')}`,
                    `${getLabel('vineyard.zilavka')}`,
                    `${getLabel('vineyard.zuplyanka')}`,
                    `${getLabel('vineyard.zupski_bojadiser')}`,
                    `${getLabel('vineyard.afus_ali')}`,
                    `${getLabel('vineyard.agadaj')}`,
                    `${getLabel('vineyard.alicante_bouschet')}`,
                    `${getLabel('vineyard.white_beglerka')}`,
                    `${getLabel('vineyard.black_beglerka')}`,
                    `${getLabel('vineyard.belan')}`,
                ],
                title: `${getLabel('cultivar_type')}`,
                type: 'string',
                default: ''
            },
            PLANT_AREA: {
                title: `${getLabel('area')}`,
                type: 'string',
                default: ''
            },
            NUMBER_OF_TREES: {
                title: `${getLabel('number_of_trees')}`,
                type: 'string',
                default: ''
            },
            YEAR_OF_PLANTING_TREES: {
                title: `${getLabel('year_of_planting')}`,
                type: 'string',
                default: ''
            },
            TREES_DISTANCE: {
                title: `${getLabel('trees_distance')}`,
                type: 'string',
                default: ''
            },
            TREES_ROW_DISTANCE: {
                title: `${getLabel('trees_row_distance')}`,
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

export const drawAPWithLineMsg = [
    'Алатката за исцртување на земјоделска парцела (со линија) е активна.',
    '1. Започнете со поставување на точка која ќе биде центроидот на парцелата.',
    '2. Исцртајте ја линијата која ќе ја дефинира формата на парцелата.'
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
    `${getLabel('calculate_cad_intersections_msg')}`,
]

export const loadParcelMsg = [
    `${getLabel('load_agricultural_parcel_msg')}`,
]

export const cutAPMsg = [
    `${getLabel('cut_agricultural_parcel_msg')}`,
    ''
]

export const fillAPMsg = [
    `${getLabel('fill_agricultural_parcel_msg')}`,
    ''
]

export const mergeAPMsg = [
    `${getLabel('merge_agricultural_parcel_msg')}`,
    ''
]