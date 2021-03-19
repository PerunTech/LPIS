import {crop_codes_idx, crop_codes_desc} from './Crop_Codes';

export const metadata = {
    type: 'land_use_plan',
    namePath: 'feature.properties.parent_id',
    schema: {
        properties: {
            CROP_CODE: {
                enum: crop_codes_idx,
                enumNames: crop_codes_desc,
                title: 'Земјоделска култура',
                type: 'number',
                default: 1,
            },
            AREA: {
                title: 'Површина',
                type: 'number',
                default: 0
            },
            NUMBER_PLANTS: {
                title: 'Број на насади',
                type: 'number',
                default: 0
            },
            IS_ORGANIC: {
                title: 'Органско производство',
                type: 'boolean',
                default: false
            },
        },
        /*required: ['CROP_CODE'],*/
        'type': 'object',
    },
    uiSchema: {
        AREA: { 'ui:disabled': true },
    }
};

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
        color: '#00E334',
        fillColor: '#00E334',
        opacity: 0.9,
        fillOpacity: 0.25,
        dashArray: [10, 10],
        showMeasurements: true
    },
    // the temporary line from the last drawn marker to the mouse cursor
    hintlineStyle: {
        weight: 2.0,
        stroke: true,
        color: '#00E334',
        fillColor: '#00E334',
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
        color: '#00E334',
        fillColor: '#00E334',
        opacity: 0.9,
        fillOpacity: 0.25,
        showMeasurements: true,
        metadata: metadata
    }
};
export const createCPMsg = [
    'Одберете слободна земјоделска парцела за да додадете производна парцела.',
    '1. Притиснете на левото копче од глувчето врз земјоделската парцела за да направите избор.',
    '2. Производната парцела ќе се исцрта според границите на избраната земјоделска парцела.',
    '3. Одбраната локација мора да припаѓа во границите на активна земјоделска парцела.',
    '4. Одбраната локација не смее да се преклопува со површината на друга производна парцела.'
];
export const drawCPMsg = [
    'Алатката за исцртување на производна парцела е активна.',
    '1. Започнете со поставување на првото теме од парцелата, со притискање на левото копче од глувчето на саканата локација на мапата.',
    '2. Продолжете со поставување на темиња според теренот прикажан на мапата и контурите на земјоделската парцела.',
    '3. За крај на цртањето и комплетирање на парцелата, притиснете врз првото поставено теме.',
    '4. Полигонот мора да има најмалку три (3) темиња.',
    '5. Полигонот мора да биде затворен.',
    '6. Полигонот не смее да се сече сам себе.',
];
export const deleteCPMsg = [
    'Одберете производна парцела на мапата која ќе се избрише од базата на податоци.',
    '1. Изборот се прави со притискање на левото копче од глувчето врз производната парцела.',
    '2. Одеднаш може да биде избришана само една производна парцела.',
];

export const editCPMsg = [
    'Одберете производна парцела на мапата чија просторна определба ќе се менува.',
    '1. Изборот се прави со притискање на левото копче од глувчето врз производната парцела.',
    '2. По направениот избор, алаката за менување на просторна определба се активира.',
    '3. За промена на положбата на едно теме, притиснете и држете на левото копче од глувчето, влечејќи на саканата локација. ',
    '4. За додавање на ново теме, притиснете на левото копче од глувчето врз едно од помошните темиња кои се наоѓаат на средината '
    + 'од секоја линија на полигонот.',
    '5. За бришење на теме, притиснете на десното копче од глувчето врз темето кое сакате да се отстрани.'
]

export const restCP = {
    save_cp: {
        url: '/table/createTableRecord/{init.token}/LAND_USE_PLAN/0',
        method: 'post',
        responseType: 'json'
    }
}