import { React, Loading, elements } from 'perun-core'
import { core, ui, tools } from '../../../Spatial'
import { Form } from '../agriParcel/Form'
import { Guidance } from '../agriParcel/Guidance'
import { ProcessButton } from '../ProcessButton';
import { config, landscapeFeaturesSchema } from './Config'
const { schema, uiSchema } = landscapeFeaturesSchema
import { decodeResponse, getLabel } from '../../Util';

const { Map, factory, store, connect, http } = core
const { draw: { polygon } } = tools
const { DrawActions, Icon } = ui
const { alertUser } = elements
const { useReducer } = React

const _id = 'landscapeFeaturesPolygon'

const _Polygon = ({ processID }) => {
  const [{ data, layer, loading, isGuided, showForm }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { data: {}, layer: {}, loading: false, isGuided: false, showForm: false });

  const setLandscapeFeaturePolygon = e => {
    if (e && e.layer) {
      setState({ layer: e.layer, isGuided: false, showForm: true })
    }
  }

  const enable = () => {
    Map.on('new_shape', e => setLandscapeFeaturePolygon(e))
    store.dispatch({ processID: _id })
    setState({ isGuided: true, showForm: false })
    polygon.enable(config)
  }

  const disable = () => {
    Map.off('new_shape')
    store.dispatch({ processID: '' })
    setState({ data: {}, layer: {}, loading: false, isGuided: false, showForm: false })
    layer.removeFrom && layer.removeFrom(Map)
    polygon.disable('force')
  }

  const renderGuideForm = () => {
    return (
      <Guidance
        id={_id}
        finish={() => polygon._finishShape()}
        undo={() => polygon._removeLastVertex()}
        disable={disable}
        title={getLabel('landscape_features_polygon')}
        msg={['', '']}
      />
    )
  }

  const onSubmit = ({ formData }) => {
    setState({ loading: true })
    const url = `/lpis/landscape-features/save/polygon/{init.token}`
    const data = JSON.stringify({
      ...formData,
      GEOM: factory.GeoJSON.fromLayer(layer),
    })
    http.call('save_lf', { data, url, method: 'post', responseType: 'arraybuffer' }).then(() => {
      disable();
      alertUser(true, 'success', getLabel('successfully_saved'), getLabel('successfully_saved_landscape_features'))
    }).catch((error) => {
      const { response } = error
      const errorMsg = decodeResponse(response, 'landscape_features')
      layer.removeFrom(Map);
      disable();
      alertUser(true, 'error', getLabel('something_went_wrong'), errorMsg)
    })
  }

  const onChange = ({ formData }) => {
    setState({ data: { ...data, ...formData } });
  }

  const renderForm = () => {
    const form = (
      <Form
        isSimple
        schema={schema}
        uiSchema={uiSchema}
        formData={data}
        onSubmit={onSubmit}
        onChange={onChange} >
        <DrawActions cancel={disable} />
      </Form>
    )

    return form
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
    <ProcessButton id={_id} onClick={enable}>
      <Icon name='selection-polygon' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('polygon')}</span>
      {processID === _id && renderComponent()}
      {loading && <Loading />}
    </ProcessButton>
  )
}

export const Polygon = connect(state => ({
  processID: state.app.processID
}))(_Polygon)
