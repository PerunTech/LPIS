import { React } from 'perun-core';
import * as shpLib from 'shapefile'
import { core, ui } from '../../../Spatial';
import { getLabel } from '../../Util';
import { shpConfig } from './Util';

const { Button, Icon } = ui;
const { factory, Map } = core;
const _id = 'shapefile';

export const ImportSHP = () => {
  const inputFile = React.useRef(null);
  const handleClick = () => inputFile.current.click();

  /**
  * Allow upload of multiple files.
  * Test concurrent or parallel processing of multiple files.
  * Test FileReader instances for each file, or shared. Status change on each proccess may lead to bugs when reused.
  * 
  * Revise file extension check, maybe allow for shp.open to fail gracefully. Appends ext already.
  * Consider adding aggregate size check, prevent browser crash on large data input.
  * 
  * Consider WebWorkers.
  */
  const importShp = () => {
    // Filter input, include only .shp files. Measure aggregate size while at it.
    const shp = {
      size: 0, // in bytes, convert aggregate only in runtime.
      data: [] // file list
    };
    Object.values(document.getElementById('shapefile-input').files).forEach(f => {
      String(f.name).split('.').reverse().findIndex(v => v === 'shp') > -1
        && ((shp.size += f.size), shp.data.push(f));
    });

    // Check agg. size and exit on overflow. Convert byte to mb, max size is 20.
    if ((shp.size / (1024 * 1024)).toFixed(2) > 20) {
      return elements.alertUser(true,
        'error',
        'The .shp files import was unsuccessful.',
        'The max size is 20 MB.');
    }

    // Process stream and render.
    shp.data.forEach(f => {
      // Open new Reader for each, run concurrently.
      const fr = new FileReader();

      fr.onloadend = function (e) {
        shpLib.openShp(e.target.result, {})
          .then(source => source.read()
            .then(function log(result) {
              // no more records, exit.
              if (result.done) return;

              // Disable snap!
              // init our factory.GeoJSON, visualize data. 
              const geojson = factory.geoJSON(result.value, shpConfig);
              geojson.getLayers().forEach(l => l.addTo(Map));
              Map.fitBounds(geojson.getBounds(), { padding: [100, 100] })
              // move cursor to next record, do above again.
              return source.read().then(log);
            }))
          .catch(error => console.error(error.stack))
      }

      fr.readAsArrayBuffer(f);
    });
  }

  return <div id={_id} >
    <Button
      onClick={handleClick}
      className={_id}
      title={getLabel('import_shapefile')}>
      <Icon name={_id} size='36px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('import_shapefile')}</span>
    </Button>
    <input type='file' id='shapefile-input' ref={inputFile} onInput={importShp} multiple style={{ display: 'none' }} />
  </div>;
}
