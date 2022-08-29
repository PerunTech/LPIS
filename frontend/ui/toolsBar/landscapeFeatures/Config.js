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
    color: '#33FF70',
    fillColor: '#33FF70',
    opacity: 0.9,
    fillOpacity: 0.25,
    dashArray: [10, 10],
    showMeasurements: true
  },
  // the temporary line from the last drawn marker to the mouse cursor
  hintlineStyle: {
    weight: 2.0,
    stroke: true,
    color: '#33FF70',
    fillColor: '#33FF70',
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
    color: '#33FF70',
    fillColor: '#33FF70',
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
  }
};

export const landscapeFeaturesSchema = {
  schema: {
    properties: {
      TYPE: {
        enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        enumNames: [
          'Жива ограда', 'Изолирани дрва', 'Дрва во линија', 'Дрва во група', 'Граници (Field margins)',
          'Канал(и) или Ров(ови)', 'Езерце', 'Камени ѕидови', 'Тераси'
        ],
        maxLength: 50,
        title: 'Вид',
        type: 'string',
        default: '1'
      },
      NAME: {
        maxLength: 2000,
        title: 'Назив',
        type: 'string',
        default: ''
      },
    },
    required: ['TYPE', 'NAME'],
    type: 'object',
  },
  uiSchema: {

  }
};
