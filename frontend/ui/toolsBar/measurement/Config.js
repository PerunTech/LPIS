export const MEASURE_CONFIG = {
  // allow multiple drawn shapes
  repeatable: true,
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
    color: '#FFC400',
    fillColor: '#FFC400',
    opacity: 0.9,
    fillOpacity: 0.25,
    dashArray: [10, 10],
    showMeasurements: true
  },
  // the temporary line from the last drawn marker to the mouse cursor
  hintlineStyle: {
    weight: 2.0,
    stroke: true,
    color: '#FFC400',
    fillColor: '#FFC400',
    opacity: 0.9,
    fillOpacity: 0.25,
    dashArray: [10, 10],
    /* This will enable runtime calculation of measurements on each new pixel location of the mouse cursor. */
    /* DO NOT ENABLE, impedes application performance, creates hundreds - thousands DOM elements each second. */
    /* showMeasurements: true */
  },
  // show a marker at the cursor
  cursorMarker: false,
  // specify type of layer event to finish the drawn shape
  // example events: 'mouseout', 'dblclick', 'contextmenu'
  finishOn: null
};

export const MEASURE_AREA = {
  // allow multiple drawn shapes
  repeatable: true,
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
    color: '#FFC400',
    fillColor: '#FFC400',
    opacity: 0.9,
    fillOpacity: 0.25,
    dashArray: [10, 10],
    showMeasurements: true
  },
  // the temporary line from the last drawn marker to the mouse cursor
  hintlineStyle: {
    weight: 2.0,
    stroke: true,
    color: '#FFC400',
    fillColor: '#FFC400',
    opacity: 0.9,
    fillOpacity: 0.25,
    dashArray: [10, 10],
    /* This will enable runtime calculation of measurements on each new pixel location of the mouse cursor. */
    /* DO NOT ENABLE, impedes application performance, creates hundreds - thousands DOM elements each second. */
    /* showMeasurements: true */
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
    color: '#FFC400',
    fillColor: '#FFC400',
    opacity: 0.9,
    fillOpacity: 0.25,
    dashArray: [10, 10],
    showMeasurements: true,
  },
  descriptor: 'measurement'
}

export const MEASURE_LENGTH = {
  // allow multiple drawn shapes
  repeatable: true,
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
    color: '#FFC400',
    fillColor: '#FFC400',
    opacity: 0.9,
    fillOpacity: 0.25,
    dashArray: [10, 10],
    showMeasurements: true
  },
  // the temporary line from the last drawn marker to the mouse cursor
  hintlineStyle: {
    weight: 2.0,
    stroke: true,
    color: '#FFC400',
    fillColor: '#FFC400',
    opacity: 0.9,
    fillOpacity: 0.25,
    dashArray: [10, 10],
    /* This will enable runtime calculation of measurements on each new pixel location of the mouse cursor. */
    /* DO NOT ENABLE, impedes application performance, creates hundreds - thousands DOM elements each second. */
    /* showMeasurements: true */
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
    color: '#FFC400',
    fillColor: '#FFC400',
    opacity: 0.9,
    fillOpacity: 0.25,
    dashArray: [10, 10],
    showMeasurements: true,
  },
  descriptor: 'measurement'
}
