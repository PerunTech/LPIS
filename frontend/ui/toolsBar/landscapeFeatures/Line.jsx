import { React, Loading, elements } from 'perun-core'
import { core, ui, tools } from '../../../Spatial'
import { Form } from '../agriParcel/Form'
import { Guidance } from '../agriParcel/Guidance'
import { ProcessButton } from '../ProcessButton';
import { config, landscapeFeaturesSchema } from './Config'
const { schema, uiSchema } = landscapeFeaturesSchema
import { decodeResponse, getLabel } from '../../Util';

const { Map, factory, store, connect, http } = core
const { draw: { line } } = tools
const { DrawActions, Icon } = ui
const { alertUser } = elements
const { useReducer } = React

const _id = 'landscapeFeaturesLine'

const _Line = ({ processID }) => {
  const [{ data, layer, loading, isGuided, showForm }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { data: {}, layer: {}, loading: false, isGuided: false, showForm: false });

  const setLandscapeFeatureLine = e => {
    if (e && e.layer) {
      setState({ layer: e.layer, isGuided: false, showForm: true })
    }
  }

  const enable = () => {
    Map.on('new_shape', e => setLandscapeFeatureLine(e))
    store.dispatch({ processID: _id })
    setState({ isGuided: true, showForm: false })
    line.enable(config)
  }

  const disable = () => {
    Map.off('new_shape')
    store.dispatch({ processID: '' })
    setState({ data: {}, layer: {}, loading: false, isGuided: false, showForm: false })
    layer.removeFrom && layer.removeFrom(Map)
    line.disable('force')
  }

  const renderGuideForm = () => {
    return (
      <Guidance
        id={_id}
        finish={() => line._finishShape()}
        undo={() => line._removeLastVertex()}
        disable={disable}
        title={getLabel('landscape_features_line')}
        msg={['', '']}
      />
    )
  }

  const onSubmit = ({ formData }) => {
    setState({ loading: true })
    const url = `/lpis/landscape-features/save/line/{init.token}`
    const data = JSON.stringify({
      ...formData,
      GEOM: factory.GeoJSON.fromLayer(layer),
    })
    http.call('save_lf', { data, url, method: 'post', responseType: 'arraybuffer' }).then(() => {
      disable();
      alertUser(true, 'success', 'Успешно зачувување', 'Пејсажните обележја се запишани во базата на податоци.')
    }).catch((error) => {
      const { response } = error
      const errorMsg = decodeResponse(response, 'landscape_features')
      layer.removeFrom(Map);
      disable();
      alertUser(true, 'error', 'Грешка при зачувување', errorMsg)
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
      <Icon name='length' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('line')}</span>
      {processID === _id && renderComponent()}
      {loading && <Loading />}
    </ProcessButton>
  )
}

export const Line = connect(state => ({
  processID: state.app.processID
}))(_Line)
