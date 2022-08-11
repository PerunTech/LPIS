import { core } from '../../Spatial'
import { strcmp } from '../../ui/Util'

const { Map } = core

/**
 * Truncate a string if it's longer than a certain number of characters
 * @param  {String} string The string that will be truncated
 * @param  {Number} n The number against which we're going to check the string length
 * @param  {Boolean} useWordBoundary Last word boundary (i.e. if the string should be truncated to the last whole word)
 */
export function truncate (string, n, useWordBoundary) {
  if (string.length <= n) return string
  const subString = string.substring(0, n - 1)
  return (useWordBoundary ? subString.substring(0, subString.lastIndexOf(' ')) : subString) + '...'
}

export const removeCadParcels = () => {
  Map.eachLayer(function (layer) {
    if (!!layer.toGeoJSON) {
      if (layer?.feature?.properties?.DESCRIPTOR && strcmp(layer?.feature?.properties?.DESCRIPTOR, 'CAD_PARCEL')) {
        Map.removeLayer(layer);
      }
    }
  });
}

export const removeSearchedParcels = () => {
  Map.eachLayer(function (layer) {
    if (!!layer.toGeoJSON) {
      if (layer?.feature?.properties?.DESCRIPTOR && strcmp(layer?.feature?.properties?.DESCRIPTOR, 'SEARCHED_LPIS_PARCEL')) {
        Map.removeLayer(layer);
      }
    }
  });
}
