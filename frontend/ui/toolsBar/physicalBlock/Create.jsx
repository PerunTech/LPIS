import { React, Loading, elements } from 'perun-core';
import { core, tools, ui } from '../../../Spatial';
import { ProcessButton } from '../ProcessButton';
import { Guidance } from '../agriParcel/Guidance';
import { Form } from './Form';
import { config } from './Config';
import { decodeResponse, getLabel } from '../../Util';
import { getPhysicalBlockInfo } from './Load';

const { Map, store, connect, factory, http } = core;
const { draw: { polygon } } = tools;
const { Icon, DrawActions } = ui;
const { alertUser } = elements;
const { useReducer, useEffect } = React;

const _id = 'createBlock';

const _CreateBlock = ({ processID }) => {
  const [{ loading, point, layer, data, isGuided, showForm }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { loading: false, point: {}, layer: {}, data: {}, isGuided: false, showForm: false });

  useEffect(() => {
    return () => {
      Map.off('new_shape');
      polygon.disable('force');
    }
  }, [])

  const enable = () => {
    Map.on('new_shape', e => {
      if (e && e.layer) {
        const p = Map.transform(e.layer.getBounds().getCenter())
        setState({ point: p, layer: e.layer, loading: false, isGuided: false, showForm: true })
        e.layer.addTo(Map)
      }

      Map.off('new_shape')
    });

    setState({ loading: false, isGuided: true, showForm: false, point: {}, layer: {}, data: {} });
    store.dispatch({ processID: _id });
    polygon.enable(config);
  }

  const disable = () => {
    Map.off('new_shape');
    setState({ loading: false, data: {} })
    store.dispatch({ processID: '' });
    layer.removeFrom && layer.removeFrom(Map);
    polygon.disable('force');
  }

  const onChange = ({ formData }) => {
    setState({ data: { ...data, ...formData } });
  }

  const onSubmit = ({ formData }) => {
    setState({ loading: true })
    const url = `/lpis/parcels/save/{init.token}/PHYSICAL_BLOCK/0/0/2/2/2`
    const data = JSON.stringify({
      ...formData,
      GEOM: factory.GeoJSON.fromLayer(layer),
    })
    http.call('save_pb', { data, url, method: 'post', responseType: 'arraybuffer' }).then(() => {
      disable();
      alertUser(true, 'success', `${getLabel('successfully_saved')}`, `${getLabel('successfully_saved_physical_block')}`)
      getPhysicalBlockInfo(point)
    }).catch((error) => {
      const { response } = error
      const errorMsg = decodeResponse(response, 'physical_block')
      layer.removeFrom(Map);
      disable();
      alertUser(true, 'error', `${getLabel('save_failed')}`, errorMsg)
    })
  }

  const renderGuideForm = () => {
    return (
      <Guidance
        id={_id}
        title={getLabel('draw_physical_block')}
        msg={[getLabel('draw_physical_block_msg'), '']}
        finish={() => polygon._finishShape()}
        undo={() => polygon._removeLastVertex()}
        disable={disable}
      />
    )
  }

  const renderForm = () => {
    return (
      <Form onSubmit={onSubmit} onChange={onChange} data={data}>
        <DrawActions
          finish={() => polygon._finishShape()}
          undo={() => polygon._removeLastVertex()}
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
      onClick={enable}
      title={getLabel('draw_physical_block')}
    >
      <Icon name={_id} size='34px' />
      <span style={{ display: 'block', marginTop: '1px' }}>{getLabel('draw_physical_block')}</span>
      {processID === _id && componentToRender()}
      {loading && <Loading />}
    </ProcessButton>
  )
}

export const CreateBlock = connect(state => ({ processID: state.app.processID }))(_CreateBlock)
