import { React, Loading, elements } from 'perun-core';
import { core, ui, data, tools } from '../../../Spatial';
import { config } from './Config';
import { Guidance } from '../agriParcel/Guidance';
import { Form } from './Form';
import { ProcessButton } from '../ProcessButton';
import { decodeResponse } from '../../Util';
import { getPhysicalBlockInfo } from './Load';

const { Map, store, factory, http } = core;
const { geobuf, protobuf } = data;
const { draw: { polygon } } = tools
const { Icon, DrawActions } = ui;
const { alertUser } = elements;
const { useReducer, useEffect } = React;

const _id = 'fill-pb';

const _Fill = ({ processID, loadedPhysicalBlocks }) => {
  const [{ getNewLayer, point, layer, data, loading, isGuided, showForm }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }), { getNewLayer: false, point: {}, layer: {}, data: {}, loading: false, isGuided: false, showForm: false });

  useEffect(() => {
    return () => {
      polygon.disable('force');
      Map.off('new_shape');
    }
  }, [])

  const enable = () => {
    if (!Object.keys(loadedPhysicalBlocks).length > 0) {
      alertUser(true, 'info', 'Не се пронајдени вчитани физички блокови', 'Вчитајте физички блокови пред да ја користите алатката за пополнување')
      disable()
    } else {
      Map.on('new_shape', e => fillPB(e));
      // state setters
      store.dispatch({ processID: _id });
      setState({ isGuided: true, showForm: false })
      // init draw handler
      polygon.enable(config);
    }
  }

  const disable = () => {
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
    setState({ getNewLayer: false, point: {}, layer: {}, data: {}, loading: false, isGuided: false, showForm: false });
    store.dispatch({ processID: '' });
    // We remove the working geometry, save process will add the result, as well as additional vectors.
    layer.removeFrom && layer.removeFrom(Map);
    polygon.disable('force');
  }

  const fillPB = e => {
    if (e && e.layer) {
      setState({ loading: true, isGuided: false, layer: e.layer })
      http.call(_id, {
        url: '/spatial/geometry/fill/{init.token}/PHYSICAL_BLOCK/' + 0,
        method: 'post',
        responseType: 'arraybuffer',
        data: JSON.stringify(factory.GeoJSON.fromLayer(e.layer))
      }).then(response => {
        const buff = geobuf.decode(protobuf(response));
        const geojson = factory.geoJSON(buff, config.pathOptions);
        geojson.getLayers().forEach(layer => {
          layer.addTo(Map);
          const p = Map.transform(layer.getBounds().getCenter());
          e.layer.removeFrom(Map);
          setState({
            point: p,
            layer: layer,
            data: {
              ...layer.feature.properties,
              OBJECT_ID: Number(layer.feature.id)
            },
            showForm: true,
            loading: false
          })
        })
      }).catch(error => {
        const { response } = error
        const errorMsg = decodeResponse(response, 'physical_block')
        alertUser(true, 'error', 'Грешка при пополнување физички блок', errorMsg);
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
      setState({ getNewLayer: true })
      disable();
      alertUser(true, 'success', 'Успешно зачувување', 'Физичкиот блок е запишан во базата на податоци.')
    }).catch(() => {
      layer.removeFrom(Map);
      setState({ getNewLayer: false })
      disable();
      alertUser(true, 'error', 'Грешка при зачувување', 'Физичкиот блок не е запишан во базата на податоци.')
    })
  }

  const onChange = ({ formData }) => {
    setState({ data: { ...data, ...formData } });
  }

  const renderGuideForm = () => {
    return (
      <Guidance id={_id}
        finish={() => polygon._finishShape()}
        undo={() => polygon._removeLastVertex()}
        disable={() => disable()}
        msg={['Алатката за пополнување физички блок е активна', '']}
        title='Пополни физички блок'
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
    <ProcessButton id={_id} onClick={enable} title='Пополни блок'>
      <Icon name={_id} size='34px' />
      <span style={{ display: 'block', marginTop: '5px' }}>Пополни блок</span>
      {processID === _id && renderComponent()}
      {loading && <Loading />}
    </ProcessButton>
  )
}

export const Fill = core.connect(state => ({
  processID: state.app.processID,
  loadedPhysicalBlocks: state.lpis?.loadedPhysicalBlocks,
}))(_Fill)
