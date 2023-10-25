import { write } from '@mapbox/shp-write';
import { core } from '../../../Spatial';
import { strcmp } from '../../Util';

const { Map } = core;

const prj = 'PROJCS["GK7",GEOGCS["Bessel 1841",DATUM["unknown",SPHEROID["bessel",6377397.155,299.1528128],TOWGS84[521.748,229.489,590.921,-4.029,-4.488,15.521,-9.78]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",21],PARAMETER["scale_factor",0.9999],PARAMETER["false_easting",7500000],PARAMETER["false_northing",0],UNIT["Meter",1],AUTHORITY["epsg","6316"]]';

function justCoords(t) {
  if (t.geometry.coordinates[0] !== undefined &&
    t.geometry.coordinates[0][0] !== undefined &&
    t.geometry.coordinates[0][0][0] !== undefined) {
    return t.geometry.coordinates[0];
  } else {
    return t.geometry.coordinates;
  }
}

function justProps(t) {
  return t.properties;
}

function isType(t) {
  return function (f) { return f.geometry.type === t; };
}

const justType = (gj, type, TYPE) => {
  const oftype = gj.features.filter(isType(type));
  return {
    geometries: (TYPE === 'POLYGON' || TYPE === 'POLYLINE') ? [oftype.map(justCoords)] : oftype.map(justCoords),
    properties: oftype.map(justProps),
    type: TYPE
  };
};

export const exportFile = (gj, options, layers) => {
  [justType(gj, 'Point', 'POINT'), justType(gj, 'LineString', 'POLYLINE'), justType(gj, 'Polygon', 'POLYGON')]
    .forEach(function (l) {
      if (l.geometries.length && l.geometries[0].length) {
        write(
          // field definitions
          l.properties,
          // geometry type
          l.type,
          // geometries
          l.geometries,
          function (err, files) {
            const fileName = options && options.types[l.type.toLowerCase()] ? options.types[l.type.toLowerCase()] : l.type;
            layers.file(fileName + '.shp', files.shp.buffer, { binary: true });
            layers.file(fileName + '.shx', files.shx.buffer, { binary: true });
            layers.file(fileName + '.dbf', files.dbf.buffer, { binary: true });
            layers.file(fileName + '.prj', prj);
          });
      }
    });
};

export const shpConfig = {
  weight: 2.0,
  stroke: true,
  color: '#00E334',
  fillColor: '#00E334',
  opacity: 0.9,
  fillOpacity: 0.25,
}

export const eraseIoLayers = () => {
  Map.eachLayer(function (layer) {
    if (!!layer.toGeoJSON) {
      if (strcmp(layer.DESCRIPTOR, 'IO_LAYER')) {
        layer.removeFrom(Map)
      }
    }
  });
}
