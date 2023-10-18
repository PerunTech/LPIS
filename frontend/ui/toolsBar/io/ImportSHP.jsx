import { React, Loading, elements } from 'perun-core';
import shp from 'shpjs'
import { ProcessButton } from '../ProcessButton';
import { core, ui } from '../../../Spatial';
import { getLabel, strcmp } from '../../Util';
import { shpConfig } from './Util';

const { Button, Icon, DrawActions, Modal } = ui;
const { factory, store, Map } = core;
const { alertUser } = elements;
const { useRef, useReducer } = React;
const _id = 'shapefile';

const _ImportSHP = ({ processID }) => {
  const [{ showForm, loading, layers }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }), { showForm: false, loading: false, layers: [] });

  const inputFile = useRef(null);

  const handleClick = () => {
    store.dispatch({ processID: _id })
    inputFile.current.click()
  };

  const disable = () => {
    store.dispatch({ processID: '' });
    setState({ showForm: false, loading: false, layers: [] })
  }

  const importShp = () => {
    const file = inputFile.current.files[0]
    // Check if a file was selected
    // Get the extension using the file name
    const extension = file.name.match(/\.[0-9a-z]+$/i)[0]
    // Read the file as an array buffer (binary data)
    const fr = new FileReader();
    fr.onload = readBinary;
    fr.readAsArrayBuffer(file);
    // Now read/decode the binary data
    function readBinary() {
      const result = fr.result
      // Check for zip archives
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
              setState({ layers: content.features, showForm: true })
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
        // Check for .dbf files
      } else if (strcmp(extension, '.dbf')) {
        const dbfResult = shp.parseDbf(result)
        if (Array.isArray(dbfResult) && dbfResult.length > 0) {
          dbfResult.forEach(element => {
            console.log(element)
          })
        }
        // Check for pure .shp files (shapefiles)
      } else if (strcmp(extension, '.shp')) {
        const shpResult = shp.parseShp(result)
        if (Array.isArray(shpResult) && shpResult.length > 0) {
          setState({ layers: shpResult, showForm: true })
          shpResult.forEach(element => {
            const geojson = factory.geoJSON(element, shpConfig);
            geojson.getLayers().forEach(l => l.addTo(Map));
            Map.fitBounds(geojson.getBounds(), { padding: [100, 100] })
          })
        }
      } else {
        alertUser(true, 'info', `${getLabel('unsupported_extension')}`, '', disable)
      }

      // Clean-up the input value
      if (inputFile.current) {
        inputFile.current.value = ''
      }
    }
  }

  const renderComponent = () => {
    const numberOfLayers = layers.length || 0

    return (
      <Modal id='measure-dialog'
        show
        backdrop={false}
        enforceFocus={false}
        container={document.getElementsByClassName('control-map')[0]} >
        <Modal.Title>
          <Button disabled className='as-label ap-modal-title' >{getLabel('import_shapefile')}</Button>
          <DrawActions cancel={disable} />
        </Modal.Title>
        <Modal.Body className='ap-modal-body import-shp-modal-body' >
          <h5>{getLabel('number_of_layers_in_shapefile')}: {numberOfLayers}</h5>
          <p className='mb-n2'>{getLabel('list_of_layers_in_shapefile')}</p>
          <div className='d-flex flex-column justify-content-center align-items-center mt-3'>
            {layers.map(layer => {
              return (
                layer?.properties ? <div className='border p-2 mb-2'>
                  {Object.entries(layer.properties).map(([key, value]) => {
                    return (
                      <div className='d-flex flex-column justify-content-center align-items-center'>
                        <span className='mb-1'>{key}: {value}</span>
                      </div>
                    )
                  })}
                </div> : <p>{getLabel('layer_has_no_properties')}</p>
              )
            })}
          </div>
        </Modal.Body>
      </Modal>
    )
  }

  return (
    <div id={_id} >
      {loading && <Loading />}
      <ProcessButton
        id={_id}
        onClick={handleClick}
        className={_id}
        title={getLabel('import_shapefile')}>
        <Icon name={_id} size='36px' />
        <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('import_shapefile')}</span>
      </ProcessButton>
      <input type='file' id='shapefile-input' ref={inputFile} onInput={importShp} multiple style={{ display: 'none' }} />
      {processID === _id && showForm && renderComponent()}
    </div>
  );
}

export const ImportSHP = core.connect(state => ({
  processID: state.app.processID
}))(_ImportSHP)
