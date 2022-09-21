import { React } from 'perun-core';
import { core, ui } from '../../../Spatial';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { exportFile } from './Util';

const { Button, Icon } = ui;
const { store, factory } = core;

export const ExportSHP = () => {
  const handleClick = () => {
    const farmerFIC = store.getState()?.farmRegistry?.fic
    const allLayers = Object.values(store.getState().data.layers)
    const zipArchiveName = farmerFIC
    const zip = new JSZip()
    const layers = zip.folder(zipArchiveName)

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

    let generateOptions = { compression: 'STORE' };

    if (!process.browser) {
      generateOptions.type = 'nodebuffer';
    }

    zip.generateAsync({ type: 'blob' }).then(blob => {
      saveAs(blob, zipArchiveName + '.zip');
    })
  }

  return (
    <Button onClick={handleClick}>
      <Icon name='shapefile' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>Извези SHP</span>
    </Button>
  )
}
