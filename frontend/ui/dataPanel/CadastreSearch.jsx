import { React, elements } from 'perun-core'
import { core, ui } from '../../Spatial'
import { Form } from '../toolsBar/agriParcel/Form'
import { cadastreSearchFormSchema } from './CadastreConfig'

const { schema: initialSchema, uiSchema: initialUiSchema } = cadastreSearchFormSchema()
const { http, connect } = core
const { Button, DrawActions } = ui
const { alertUser } = elements
const { useReducer } = React

const _CadastreSearch = () => {
  const [{ showForm, schema, uiSchema, data }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { showForm: false, schema: {}, uiSchema: {}, data: {} });

  const toggleSearchForm = () => {
    setState({ showForm: true })
  }

  const disable = () => {
    setState({ showForm: false, data: {}, schema: {}, uiSchema: {} })
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
        setState({ schema: formSchema, uiSchema: formUiSchema })
      }
    }).catch(err => {
      console.error(err)
      alertUser(true, 'error', 'Настана грешка')
    })
  }

  const onSubmit = () => {

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
        onChange={onChange} >
        <DrawActions cancel={disable} />
      </Form>
    )

    return componentToRender
  }

  return (
    <div className='text-center'>
      <Button block variant='dark' className='mt-1 ml-2' style={{ width: '97.2%' }} onClick={toggleSearchForm}>Пребарај катастар</Button>
      {showForm && renderComponent()}
    </div>
  )
}

export const CadastreSearch = connect(state =>
  ({ actionType: state.farmRegistry?.actionType }))(_CadastreSearch)
