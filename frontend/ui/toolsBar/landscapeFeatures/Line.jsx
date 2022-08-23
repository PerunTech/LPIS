import { React, Loading } from 'perun-core'
import { core, ui, tools } from '../../../Spatial'
import { config } from '../agriParcel/Config';
import { Form } from '../agriParcel/Form'
import { Guidance } from '../agriParcel/Guidance'
import { ProcessButton } from '../ProcessButton';
import { landscapeFeaturesSchema } from './Config'
const { schema, uiSchema } = landscapeFeaturesSchema

const { Map, store, connect } = core
const { draw: { line } } = tools
const { DrawActions, Icon } = ui
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
        title='Пејсажни обележја - Линија'
        msg={['', '']}
      />
    )
  }

  const onSubmit = ({ formData }) => {
    console.log(formData)
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
    <ProcessButton onClick={enable}>
      <Icon name='length' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>Линија</span>
      {processID === _id && renderComponent()}
      {loading && <Loading />}
    </ProcessButton>
  )
}

export const Line = connect(state => ({
  processID: state.app.processID
}))(_Line)
