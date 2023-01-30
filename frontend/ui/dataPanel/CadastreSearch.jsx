import { React, Loading, elements } from 'perun-core'
import { core, ui, data } from '../../Spatial'
import { Form } from '../toolsBar/agriParcel/Form'
import { removeCadParcels } from './Util'
import { cadastreSearchFormSchema, cadParcelConfig } from './CadastreConfig'
import { setCadParcelLabel } from '../toolsBar/cropParcel/Util'

const { schema: initialSchema, uiSchema: initialUiSchema } = cadastreSearchFormSchema()
const { http, factory, Map, connect } = core
const { geobuf, protobuf } = data
const { Button, Icon, DrawActions } = ui
const { alertUser } = elements
const { useReducer } = React

const _CadastreSearch = () => {
  const [{ showForm, loading, disableSearchBtn, schema, uiSchema, data }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { showForm: false, loading: false, disableSearchBtn: true, schema: {}, uiSchema: {}, data: {} });

  const handleDragStart = () => {
    // Remove the parcels when some movement starts, with a delay of half a second
    setTimeout(() => removeCadParcels(), 500)
    // Remove the event listener in the end
    removeDragStartEvent()
  }

  const handleDragEnd = () => {
    // Remove the event listener immediately
    Map.off('dragend', removeDragEndEvent)
    // Set the opposite event from the one above
    Map.on('dragstart', handleDragStart)
  }

  const removeDragStartEvent = () => {
    Map.off('dragstart', handleDragStart)
  }

  const removeDragEndEvent = () => {
    Map.off('dragend', handleDragEnd)
  }

  const toggleSearchForm = () => {
    setState({ showForm: true })
  }

  const disable = () => {
    removeCadParcels()
    setState({ showForm: false, loading: false, disableSearchBtn: true, data: {}, schema: {}, uiSchema: {} })
    removeDragStartEvent()
    removeDragEndEvent()
  }

  const getCadastralMunicipalities = sectorId => {
    http.call('get-cad-municipalities', {
      url: `/lpis/get/CadMunicipalities/{init.token}/${sectorId}`,
      method: 'get'
    }).then(res => {
      if (res.data && res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const cadMunicipalities = {}
        res.data.data.forEach(cadMunic => {
          for (const [id, name] of Object.entries(cadMunic)) {
            Reflect.set(cadMunicipalities, id, name)
          }
        })
        const { schema: formSchema, uiSchema: formUiSchema } = cadastreSearchFormSchema(cadMunicipalities)
        setState({ schema: formSchema, uiSchema: formUiSchema, disableSearchBtn: false })
      } else {
        alertUser(true, 'info', 'Не се пронајдени податоци')
      }
    }).catch(err => {
      console.error(err)
      alertUser(true, 'error', 'Настана грешка')
    })
  }

  const onSubmit = ({ formData }) => {
    removeCadParcels()
    setState({ loading: true })
    const { CADASTRAL_SECTOR: sectorId, CADASTRAL_MUNICIPALITY: municId, PARCEL_ID: parcelId } = formData
    http.call('get-cad-parcels', {
      url: `/lpis/get/CadParcel/{init.token}/${sectorId}/${municId}/${encodeURIComponent(parcelId)}`,
      method: 'get',
      responseType: 'arraybuffer'
    }).then(response => {
      setState({ loading: false })
      const proto = protobuf(response)
      const buff = geobuf.decode(proto)
      const geojson = factory.geoJSON(buff, cadParcelConfig.pathOptions)
      const layers = geojson.getLayers()
      if (Array.isArray(layers) && layers.length > 0) {
        layers.forEach(layer => {
          layer.addTo(Map)
          setCadParcelLabel(layer)
          layer.feature.properties.ID = parcelId
          layer.feature.properties.DESCRIPTOR = 'CAD_PARCEL'
          Map.fitBounds(layer.getBounds())
        })

        // Add an event listener when the dragend event is fired
        Map.on('dragend', handleDragEnd)
      } else {
        alertUser(true, 'info', 'Не се пронајдени катастарски парцели')
      }
    }).catch(err => {
      console.error(err)
      setState({ loading: false })
      alertUser(true, 'error', 'Настана грешка')
    })
  }

  const onChange = ({ formData }) => {
    setState({ data: { ...data, ...formData } });
    if ((formData.CADASTRAL_SECTOR !== data.CADASTRAL_SECTOR) && formData.CADASTRAL_SECTOR) {
      getCadastralMunicipalities(formData.CADASTRAL_SECTOR)
    }
  }

  const renderComponent = () => {
    const formSchema = Object.values(schema).length > 0 ? schema : initialSchema
    const formUiSchema = Object.values(uiSchema).length > 0 ? uiSchema : initialUiSchema
    const componentToRender = (
      <Form
        isSimple
        formTitle='Пребарување катастар'
        buttonLabel='Пребарај'
        className='cadastre-search-form'
        schema={formSchema}
        uiSchema={formUiSchema}
        formData={data}
        onSubmit={onSubmit}
        onChange={onChange}
        disableSubmitBtn={disableSearchBtn} >
        <DrawActions cancel={disable} />
      </Form>
    )

    return componentToRender
  }

  return (
    <React.Fragment>
      <Button variant='dark' className='d-flex flex-row justify-content-center align-items-center mt-1 rounded' onClick={toggleSearchForm}>
        <Icon name='search' size='20px' />
        <span style={{ margin: '3px 3px 0 3px' }}>Пребарај катастар</span>
      </Button>
      {showForm && renderComponent()}
      {loading && <Loading />}
    </React.Fragment>
  )
}

export const CadastreSearch = connect(state =>
  ({ actionType: state.farmRegistry?.actionType }))(_CadastreSearch)
