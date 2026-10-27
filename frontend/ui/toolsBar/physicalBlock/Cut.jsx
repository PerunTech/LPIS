import { React, Loading, elements } from 'perun-core';
import { core, ui, data, tools } from '../../../Spatial';
import { config } from './Config';
import { Guidance } from '../agriParcel/Guidance';
import { Form } from './Form';
import { ProcessButton } from '../ProcessButton';
import { decodeResponse, getLabel, getRandomPointInPolygon, strcmp } from '../../Util';
import { getPhysicalBlockInfo } from './Load';

const { Map, store, factory, http } = core;
const { geobuf, protobuf } = data;
const { draw: { polygon }, markerPoints } = tools;
const { Icon, DrawActions } = ui;
const { alertUser } = elements;
const { useReducer, useEffect } = React;

const _id = 'cut-pb';

const _Cut = ({ processID, loadedPhysicalBlocks }) => {
  const [{ point, layer, selectedLayer, data, loading, isGuided, showForm }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }), { point: {}, layer: {}, selectedLayer: {}, data: {}, loading: false, isGuided: false, showForm: false });

  useEffect(() => {
    return () => {
      polygon.disable('force');
      Map.off('new_shape');
    }
  }, [])

  const initAction = (layer, layers) => {
    setState({ selectedLayer: layer })
    Object.values(layers).forEach(layer => {
      layer.setStyle({ fillColor: '#f8f8ff' })
      layer.off('mouseover mouseout click')
    })
    Map.on('new_shape', e => cutPB(e, layer));
    polygon.enable(config);
    markerPoints.enable(layer, config);
  }

  const _setBlockEvents = layers => {
    Object.values(layers).forEach(layer => {
      layer.on('mouseover', function () { this.setStyle({ fillColor: '#000000' }) })
        .on('mouseout', function () { this.setStyle({ fillColor: '#f8f8ff' }) })
        .on('click', function () {
          initAction(this, layers);
        })
    })
  }

  const enable = () => {
    if (!Object.keys(loadedPhysicalBlocks).length > 0) {
      alertUser(true, 'info', getLabel('no_loaded_physical_blocks'), getLabel('load_physical_blocks_before_using_cut_tool'))
    } else {
      // state setters
      store.dispatch({ processID: _id });
      setState({ loading: false, isGuided: true, showForm: false })
      _setBlockEvents(loadedPhysicalBlocks)
    }
  }

  const disable = (getNewLayer) => {
    if (getNewLayer && Object.keys(layer).length > 0) {
      Object.values(loadedPhysicalBlocks).forEach(loadedLayer => {
        if (loadedLayer.feature.id === layer.feature.id) {
          // Remove the loaded layer from the map & from the loadedPhysicalBlocks object
          loadedLayer.removeFrom(Map)
          Reflect.deleteProperty(loadedPhysicalBlocks, loadedLayer.feature.id)
          // Get the layer once again, using the point as the WS param
          getPhysicalBlockInfo(point)
        }
      })
    }
    // Reset state, internal and application-wide.
    Map.off('new_shape');
    setState({ point: {}, layer: {}, selectedLayer: {}, data: {}, loading: false, isGuided: false, showForm: false });
    store.dispatch({ processID: '' });
    // We remove the working geometry, save process will add the result, as well as additional vectors.
    layer.removeFrom && layer.removeFrom(Map);
    polygon.disable('force');
    Map.eachLayer(function (layer) {
      if (layer.toGeoJSON) {
        if (layer?.options?.name && strcmp(layer.options.name, 'marker-point')) {
          Map.removeLayer(layer);
        }
      }
    })
  }

  const cutPB = (e, selectedLayer) => {
    if (e && e.layer) {
      setState({ loading: true })
      const selectedLayerId = selectedLayer.feature.id
      http.call(_id, {
        url: '/spatial/geometry/hole/{init.token}/PHYSICAL_BLOCK/' + 0,
        method: 'post',
        responseType: 'arraybuffer',
        data: JSON.stringify({
          OBJECT_ID: selectedLayerId,
          GEOM: factory.GeoJSON.fromLayer(e.layer)
        })
      }).then(response => {
        const buff = geobuf.decode(protobuf(response));
        const geojson = factory.geoJSON(buff, config.pathOptions);
        geojson.getLayers().forEach(layer => {
          layer.addTo(Map);
          const randomPoint = getRandomPointInPolygon(layer)
          const pointLatLngs = {
            lat: randomPoint.geometry.coordinates[1],
            lng: randomPoint.geometry.coordinates[0]
          }
          const p = Map.transform(pointLatLngs);
          e.layer.removeFrom(Map);
          setState({
            point: p,
            layer: layer,
            data: {
              ...layer.feature.properties,
              OBJECT_ID: Number(layer.feature.id)
            },
            isGuided: false,
            showForm: true,
            loading: false
          })
        })
      }).catch(error => {
        const { response } = error
        const errorMsg = decodeResponse(response, 'physical_block')
        alertUser(true, 'error', `${getLabel('cut_physical_block_error')}`, errorMsg);
        e.layer.removeFrom(Map)
        disable()
      })
    }

    Map.off('new_shape');
  }

  const onSubmit = ({ formData }) => {
    const url = `/lpis/parcels/save/{init.token}/PHYSICAL_BLOCK/${layer.feature.id}/0/2/2/2`
    const data = JSON.stringify({
      ...formData,
      GEOM: factory.GeoJSON.fromLayer(layer)
    })
    http.call('save_pb', { method: 'post', url, data }).then(() => {
      disable(true);
      alertUser(true, 'success', `${getLabel('successfully_saved')}`, `${getLabel('successfully_saved_physical_block')}`)
    }).catch(() => {
      layer.removeFrom(Map);
      disable();
      alertUser(true, 'error', `${getLabel('save_failed')}`)
    })
  }

  const onChange = ({ formData }) => {
    setState({ data: { ...data, ...formData } });
  }

  const renderGuideForm = () => {
    let msg = [`${getLabel('choose_physical_block_to_cut')}`, '']
    if (Object.keys(selectedLayer).length > 0) {
      msg = [`${getLabel('cut_physical_block_msg')}`, '']
    }
    return (
      <Guidance id={_id}
        finish={() => polygon._finishShape()}
        undo={() => polygon._removeLastVertex()}
        disable={() => disable()}
        msg={msg}
        title={getLabel('cut_physical_block')}
      />
    )
  }

  const renderForm = () => {
    return (
      <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
        <DrawActions cancel={() => disable()} />
      </Form>
    )
  }

  const renderComponent = () => {
    let componentToRender = null

    if (isGuided && !showForm) {
      componentToRender = renderGuideForm()
    } else if (showForm && !isGuided) {
      componentToRender = renderForm()
    }

    return componentToRender
  }

  return (
    <ProcessButton id={_id} onClick={enable} title={getLabel('cut_physical_block')}>
      <Icon name={_id} size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('cut_physical_block')}</span>
      {processID === _id && renderComponent()}
      {loading && <Loading />}
    </ProcessButton>
  )
}

export const Cut = core.connect(state => ({
  processID: state.app.processID,
  loadedPhysicalBlocks: state.lpis?.loadedPhysicalBlocks,
}))(_Cut)
