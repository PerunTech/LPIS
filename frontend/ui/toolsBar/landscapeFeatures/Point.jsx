import { React, Loading, elements } from 'perun-core'
import { core, ui } from '../../../Spatial'
import { Form } from '../agriParcel/Form'
import { Guidance } from '../agriParcel/Guidance'
import { ProcessButton } from '../ProcessButton'
import { landscapeFeaturesSchema } from './Config'
const { schema, uiSchema } = landscapeFeaturesSchema
import { decodeResponse, getLabel } from '../../Util'

const { Map, factory, connect, store, http } = core
const { DrawActions, Icon } = ui
const { alertUser } = elements
const { useReducer } = React

const _id = 'landscapeFeaturesPoint'

const _Point = ({ processID }) => {
  const [{ data, X, Y, layer, loading, isGuided, showForm }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { data: {}, X: 0, Y: 0, layer: {}, loading: false, isGuided: false, showForm: false });

  const enable = () => {
    store.dispatch({ processID: _id })
    setState({ isGuided: true, showForm: false })
    Map.on('click', e => {
      const latLng = e.latlng
      // Get the correct coordinates for the current CRS
      const point = Map.transform(latLng)
      // Create a marker & add it to the map
      const markerConfig = { icon: factory.divIcon({ className: 'marker-icon' }) }
      const marker = factory.marker(latLng, markerConfig)
      marker.addTo(Map)
      setState({ X: point.x, Y: point.y, layer: marker, isGuided: false, showForm: true })
    })
  }

  const disable = () => {
    Map.off('click')
    store.dispatch({ processID: '' })
    setState({ data: {}, X: 0, Y: 0, layer: {}, loading: false, isGuided: false, showForm: false })
    // This will remove the point when disabling the action
    Map.eachLayer(layer => {
      if (layer?.options?.icon) {
        layer.removeFrom(Map)
      }
    })
  }

  const renderGuideForm = () => {
    return (
      <Guidance
        id={_id}
        disable={disable}
        title={getLabel('landscape_features_point')}
        msg={['', '']}
      />
    )
  }

  const onSubmit = ({ formData }) => {
    setState({ loading: true })
    const url = `/lpis/landscape-features/save/point/{init.token}/${X}/${Y}`
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
      <Icon name='selection' size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('point')}</span>
      {processID === _id && renderComponent()}
      {loading && <Loading />}
    </ProcessButton>
  )
}

export const Point = connect(state => ({
  processID: state.app.processID
}))(_Point)
