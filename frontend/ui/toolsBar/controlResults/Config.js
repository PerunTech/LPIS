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
    color: '#00B8A5',
    fillColor: '#00B8A5',
    opacity: 0.9,
    fillOpacity: 0.25,
    dashArray: [10, 10],
    showMeasurements: true
  },
  // the temporary line from the last drawn marker to the mouse cursor
  hintlineStyle: {
    weight: 2.0,
    stroke: true,
    color: '#00B8A5',
    fillColor: '#00B8A5',
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
    color: '#00B8A5',
    fillColor: '#00B8A5',
    opacity: 0.9,
    fillOpacity: 0.25,
  }
};
