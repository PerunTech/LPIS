import { React } from 'perun-core';
import shp from 'shpjs'
import { ProcessButton } from '../ProcessButton';
import { core, ui } from '../../../Spatial';
import { getLabel, strcmp } from '../../Util';
import { shpConfig } from './Util';

const { Icon } = ui;
const { factory, store, Map } = core;
const _id = 'shapefile';

const _ImportSHP = () => {
  const inputFile = React.useRef(null);
  const handleClick = () => {
    store.dispatch({ processID: _id })
    inputFile.current.click()
  };

  const importShp = () => {
    const file = inputFile.current.files[0]
    const fileName = file.name
    const extension = fileName.match(/\.[0-9a-z]+$/i)[0]
    const fr = new FileReader();
    fr.onload = readBinary;
    fr.readAsArrayBuffer(file);
    function readBinary() {
      const result = fr.result
      if (strcmp(extension, '.zip')) {
        shp.parseZip(result).then(content => {
          if (Array.isArray(content) && content.length > 0) {
            content.forEach(element => {
              const geojson = factory.geoJSON(element, shpConfig);
              geojson.getLayers().forEach(l => l.addTo(Map));
              Map.fitBounds(geojson.getBounds(), { padding: [100, 100] })
            })
          } else if (strcmp(typeof content, 'object')) {
            if (strcmp(content.type, 'FeatureCollection') && Array.isArray(content.features) && content.features.length > 0) {
              content.features.forEach(feature => {
                const geojson = factory.geoJSON(feature, shpConfig);
                geojson.getLayers().forEach(l => l.addTo(Map));
                Map.fitBounds(geojson.getBounds(), { padding: [100, 100] })
              })
            }
          }
        }).catch(err => {
          console.error(err)
        })
      } else if (strcmp(extension, '.dbf')) {
        const dbfResult = shp.parseDbf(result)
        if (Array.isArray(dbfResult) && dbfResult.length > 0) {
          dbfResult.forEach(element => {
            console.log(element)
          })
        }
      } else if (strcmp(extension, '.shp')) {
        const shpResult = shp.parseShp(result)
        if (Array.isArray(shpResult) && shpResult.length > 0) {
          shpResult.forEach(element => {
            const geojson = factory.geoJSON(element, shpConfig);
            geojson.getLayers().forEach(l => l.addTo(Map));
            Map.fitBounds(geojson.getBounds(), { padding: [100, 100] })
          })
        }
      }

      store.dispatch({ processID: '' });
      if (inputFile.current) {
        inputFile.current.value = ''
      }
    }
  }

  return (
    <div id={_id} >
      <ProcessButton
        id={_id}
        onClick={handleClick}
        className={_id}
        title={getLabel('import_shapefile')}>
        <Icon name={_id} size='36px' />
        <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('import_shapefile')}</span>
      </ProcessButton>
      <input type='file' id='shapefile-input' ref={inputFile} onInput={importShp} multiple style={{ display: 'none' }} />
    </div>
  );
}

export const ImportSHP = core.connect(state => ({
  processID: state.app.processID
}))(_ImportSHP)
