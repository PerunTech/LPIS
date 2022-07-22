import { React, Loading, elements } from 'perun-core'
import { core, ui, data } from '../../Spatial'
import { Form } from '../toolsBar/agriParcel/Form'
import { removeCadParcels } from './Util'
import { cadastreSearchFormSchema, cadParcelConfig } from './CadastreConfig'

const { schema: initialSchema, uiSchema: initialUiSchema } = cadastreSearchFormSchema()
const { http, factory, Map, connect } = core
const { geobuf, protobuf } = data
const { Button, DrawActions } = ui
const { alertUser } = elements
const { useReducer } = React

const _CadastreSearch = () => {
  const [{ showForm, loading, disableSearchBtn, schema, uiSchema, data }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { showForm: false, loading: false, disableSearchBtn: true, schema: {}, uiSchema: {}, data: {} });

  const toggleSearchForm = () => {
    setState({ showForm: true })
  }

  const disable = () => {
    removeCadParcels()
    setState({ showForm: false, loading: false, disableSearchBtn: true, data: {}, schema: {}, uiSchema: {} })
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
          layer.feature.properties = {
            ID: parcelId,
            DESCRIPTOR: 'CAD_PARCEL'
          }
          Map.fitBounds(layer.getBounds())
        })
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
    <div className='text-center'>
      <Button block variant='dark' className='mt-1 ml-2' style={{ width: '97.2%' }} onClick={toggleSearchForm}>Пребарај катастар</Button>
      {showForm && renderComponent()}
      {loading && <Loading />}
    </div>
  )
}

export const CadastreSearch = connect(state =>
  ({ actionType: state.farmRegistry?.actionType }))(_CadastreSearch)
