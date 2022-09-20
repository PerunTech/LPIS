import { React, elements } from 'perun-core';
import { core, tools, ui } from '../../../Spatial';
import { ProcessButton } from '../ProcessButton';
import { Guidance } from '../agriParcel/Guidance';
import { Form } from './Form';
import { config } from './Config';

const { Map, store, connect, factory, http } = core;
const { draw: { polygon } } = tools;
const { Icon, DrawActions } = ui;
const { alertUser } = elements;
const { useReducer, useEffect } = React;

const _id = 'createBlock';

const _CreateBlock = ({ processID }) => {
  const [{ layer, isGuided, showForm }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { layer: {}, isGuided: false, showForm: false });

  useEffect(() => {
    return () => {
      Map.off('new_shape');
      polygon.disable('force');
    }
  }, [])

  const enable = () => {
    Map.on('new_shape', e => {
      if (e && e.layer) {
        setState({ layer: e.layer, isGuided: false, showForm: true })
        e.layer.addTo(Map)
      }

      Map.off('new_shape')
    });

    setState({ isGuided: true, showForm: false, layer: {} });
    store.dispatch({ processID: _id });
    polygon.enable(config);
  }

  const disable = () => {
    Map.off('new_shape');
    store.dispatch({ processID: '' });
    layer.removeFrom && layer.removeFrom(Map);
    polygon.disable('force');
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

  const renderGuideForm = () => {
    return (
      <Guidance
        id={_id}
        title='Нацртај блок'
        msg={['Алатката за цртање физички блок е активна', '']}
        finish={() => polygon._finishShape()}
        undo={() => polygon._removeLastVertex()}
        disable={disable}
      />
    )
  }

  const renderForm = () => {
    return (
      <Form onSubmit={onSubmit}>
        <DrawActions
          finish={() => draw.polygon._finishShape()}
          undo={() => draw.polygon._removeLastVertex()}
          cancel={disable} />
      </Form>
    )
  }

  const componentToRender = () => {
    let componentToRender = null

    if (isGuided && !showForm) {
      componentToRender = renderGuideForm()
    } else if (showForm && !isGuided) {
      componentToRender = renderForm()
    }

    return componentToRender
  }

  return (
    <ProcessButton
      id={_id}
      onClick={enable} >
      <Icon name={_id} size='34px' />
      <span style={{ display: 'block', marginTop: '1px' }}>Нацртај блок</span>
      {processID === _id && componentToRender()}
    </ProcessButton>
  )
}

export const CreateBlock = connect(state => ({ processID: state.app.processID }))(_CreateBlock)
