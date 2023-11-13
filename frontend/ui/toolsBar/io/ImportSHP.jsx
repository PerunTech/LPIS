import { React, Loading, elements } from 'perun-core';
import shp from 'shpjs'
import { nanoid } from 'nanoid'
import { ProcessButton } from '../ProcessButton';
import { core, ui } from '../../../Spatial';
import { getFarmMapAssets, getLabel, strcmp } from '../../Util';
import { eraseIoLayers, shpConfig } from './Util';

const { Button, Icon, DrawActions, Modal } = ui;
const { factory, store, Map, http } = core;
const { alertUser } = elements;
const { useRef, useReducer } = React;
const _id = 'shapefile';

const _ImportSHP = ({ processID, systemLayers, farmObjId }) => {
  const [{ showForm, loading, shapefileContent, layerName, layers }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }), { showForm: false, loading: false, shapefileContent: undefined, layerName: 'SOIL_SITES', layers: [] });

  const inputFile = useRef(null);

  const handleClick = () => {
    store.dispatch({ processID: _id })
    inputFile.current.click()
  };

  const disable = () => {
    store.dispatch({ processID: '' });
    setState({ showForm: false, loading: false, shapefileContent: undefined, layerName: 'SOIL_SITES', layers: [] })
    eraseIoLayers()
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
          setState({ shapefileContent: content })
          if (Array.isArray(content) && content.length > 0) {
            content.forEach(element => {
              const geojson = factory.geoJSON(element, shpConfig);
              geojson.getLayers().forEach(l => {
                l.DESCRIPTOR = 'IO_LAYER'
                l.addTo(Map)
              });
              Map.fitBounds(geojson.getBounds(), { padding: [100, 100] })
            })
          } else if (strcmp(typeof content, 'object')) {
            if (strcmp(content.type, 'FeatureCollection') && Array.isArray(content.features) && content.features.length > 0) {
              setState({ layers: content.features, showForm: true })
              content.features.forEach(feature => {
                const geojson = factory.geoJSON(feature, shpConfig);
                geojson.getLayers().forEach(l => {
                  l.DESCRIPTOR = 'IO_LAYER'
                  l.addTo(Map)
                });
                Map.fitBounds(geojson.getBounds(), { padding: [100, 100] })
              })
            }
          }
        }).catch(err => {
          console.error(err)
          alertUser(true, 'error', err)
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
          const shapefileContentObj = { type: 'FeatureCollection', features: [] }
          setState({ layers: shpResult, showForm: true })
          shpResult.forEach(element => {
            const geojson = factory.geoJSON(element, shpConfig);
            geojson.getLayers().forEach(l => {
              shapefileContentObj.features.push(l.feature)
              setState({ shapefileContent: shapefileContentObj })
              l.DESCRIPTOR = 'IO_LAYER'
              l.addTo(Map)
            });
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

  const onSubmit = () => {
    http.call('save_shapefile', {
      method: 'post',
      url: `/lpis/save/{init.token}/${layerName}`,
      data: JSON.stringify(shapefileContent),
    }).then(_response => {
      alertUser(true, 'success', `${getLabel('successfully_saved')}`)
      disable()
      if (farmObjId) {
        getFarmMapAssets()
      }
    }).catch(err => {
      console.error(err)
      alertUser(true, 'error', err)
    })
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
        <Modal.Body className='ap-modal-body import-shp-modal-body'>
          <h5>{getLabel('number_of_layers_in_shapefile')}: {numberOfLayers}</h5>
          <p className='import-layer-list-of-layers'>{getLabel('list_of_layers_in_shapefile')}</p>
          <div className='import-layer-main-container'>
            {layers.map(layer => {
              return (
                layer?.properties ? <div key={nanoid(4)} className='border import-layer-container'>
                  {Object.entries(layer.properties).map(([key, value], i, properties) => {
                    return (
                      <div key={nanoid(4)} className='import-layer-item'>
                        <span className={`mb-1 import-layer-span ${i === properties.length - 1 && 'import-layer-last-element'}`}><div className='import-layer-key ml-1'>{key}</div> <div className='import-layer-border'></div><div className='ml-1 import-layer-value'>{value}</div></span>
                      </div>
                    )
                  })}
                </div> : <p>{getLabel('layer_has_no_properties')}</p>
              )
            })}
          </div>
          <div className='m-2'>
            <form onSubmit={onSubmit}>
              <label htmlFor='layerName'>Layer name</label>
              <select name='layerName' id='layerName' className='form-control' required value={layerName} onChange={(e) => setState({ layerName: e.target.value })}>
                <option value='' />
                {Object.keys(systemLayers).map((systemLayer, i) => (
                  <option key={systemLayer} id={systemLayer} value={systemLayer}>{Object.values(systemLayers)[i]}</option>
                ))}
              </select>
              <Button type='submit' className='next mt-3' size=''>{getLabel('save')}</Button>
            </form>
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
  processID: state.app.processID,
  systemLayers: state.lpis?.systemLayers,
  farmObjId: state.farmRegistry?.farmObjId,
}))(_ImportSHP)
