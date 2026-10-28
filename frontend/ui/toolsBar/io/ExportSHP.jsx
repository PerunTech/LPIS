import { React } from 'perun-core';
import { core, ui } from '../../../Spatial';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { exportFile } from './Util';
import { getLabel } from '../../Util';

const { Button, Icon } = ui;
const { store, factory } = core;

export const ExportSHP = () => {
  const handleClick = () => {
    const archiveName = store.getState()?.farmRegistry?.fic || 'layers'
    const allLayers = Object.values(store.getState().data.layers)
    const zipArchiveName = archiveName
    const zip = new JSZip()
    const layers = zip.folder(zipArchiveName)

    if (Array.isArray(allLayers) && allLayers.length > 0) {
      allLayers.forEach(element => {
        const fileName = element.feature.properties.OLD_ID
        const fc = {
          type: 'FeatureCollection',
          features: [factory.GeoJSON.fromLayer(element)]
        }
        const options = {
          folder: zipArchiveName,
          types: {
            polygon: fileName
          }
        }

        exportFile(fc, options, layers);
      });

      zip.generateAsync({ type: 'blob' }).then(blob => {
        saveAs(blob, zipArchiveName + '.zip');
      })
    }
  }

  return (
    <Button onClick={handleClick}>
      <Icon name='shapefile' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('export_shapefile')}</span>
    </Button>
  )
}
