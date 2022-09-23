import { React, elements } from 'perun-core';
import { core, ui, data, tools } from '../../../Spatial';
import { config } from './Config';
import { Guidance } from '../agriParcel/Guidance';
import { Form } from './Form';
import { ProcessButton } from '../ProcessButton';
import { decodeResponse } from '../../Util';

const { Map, store, factory, http } = core;
const { geobuf, protobuf } = data;
const { draw: { polygon } } = tools
const { Icon, DrawActions } = ui;
const { alertUser } = elements;
const { useReducer, useEffect } = React;

const _id = 'fill-pb';

const _Fill = ({ processID }) => {
  const [{ layer, data, isGuided, showForm }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }), { layer: {}, data: {}, isGuided: false, showForm: false });

  useEffect(() => {
    return () => {
      polygon.disable('force');
      Map.off('new_shape');
    }
  }, [])

  const enable = () => {
    Map.on('new_shape', e => fillPB(e));
    // state setters
    store.dispatch({ processID: _id });
    setState({ isGuided: true, showForm: false })
    // init draw handler
    polygon.enable(config);
  }

  const disable = () => {
    // Reset state, internal and application-wide.
    Map.off('new_shape');
    setState({ layer: {}, data: {}, isGuided: false, showForm: false });
    store.dispatch({ processID: '' });
    // We remove the working geometry, save process will add the result, as well as additional vectors.
    layer.removeFrom && layer.removeFrom(Map);
    polygon.disable('force');
  }

  const fillPB = e => {
    if (e && e.layer) {
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
          e.layer.removeFrom(Map);
          setState({
            layer: layer,
            data: {
              ...layer.feature.properties,
              OBJECT_ID: Number(layer.feature.id)
            },
            isGuided: false,
            showForm: true
          })
        })
      }).catch(error => {
        const { response } = error
        const errorMsg = decodeResponse(response)
        alertUser(true, 'error', 'Грешка при пополнување физички блок', errorMsg);
        e.layer.removeFrom(Map)
        disable()
      })
    }

    Map.off('new_shape');
  }

  const onSubmit = ({ formData }) => {
    http.call('save_pb', {
      data: JSON.stringify({
        ...formData,
        GEOM: factory.GeoJSON.fromLayer(layer)
      })
    }).then(() => {
      disable();
      alertUser(true, 'success', 'Успешно зачувување', 'Физичкиот блок е запишан во базата на податоци.')
    }).catch(() => {
      layer.removeFrom(Map);
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
    </ProcessButton>
  )
}

export const Fill = core.connect(state => ({
  processID: state.app.processID
}))(_Fill)
