import { React, Loading, elements } from 'perun-core'
import { core, ui, data } from '../../Spatial'
import { Form } from '../toolsBar/agriParcel/Form'
import { removeSearchedParcels } from './Util'
import { lpisSearchFormSchema } from './LpisSearchConfig'
import { config as apConfig } from '../toolsBar/agriParcel/Config'
import { setSearchedParcelLabel } from '../toolsBar/cropParcel/Util'
import { bufferToString, strcmp } from '../Util'

const { schema, uiSchema } = lpisSearchFormSchema()
const { http, factory, Map, store, connect } = core
const { geobuf, protobuf } = data
const { Button, DrawActions } = ui
const { alertUser } = elements
const { useReducer, useEffect } = React

const _LpisSearch = ({ theSearchedParcelWasRemoved }) => {
  const [{ showForm, showDeleteBtn, loading, data }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }), { showForm: false, showDeleteBtn: false, loading: false, data: {} });

  useEffect(() => {
    if (showForm && theSearchedParcelWasRemoved) {
      setState({ showDeleteBtn: false })
      store.dispatch({ theSearchedParcelWasRemoved: false })
    }
  }, [showForm, theSearchedParcelWasRemoved])

  const toggleSearchForm = () => {
    setState({ showForm: true })
  }

  const disable = () => {
    removeSearchedParcels()
    setState({ showForm: false, showDeleteBtn: false, loading: false, data: {} })
  }

  const onSubmit = ({ formData }) => {
    removeSearchedParcels()
    setState({ loading: true })
    const { ID: lpisId } = formData
    http.call('get-cad-parcels', {
      url: `/lpis/get/parcel/{init.token}/${lpisId}`,
      method: 'get',
      responseType: 'arraybuffer'
    }).then(response => {
      setState({ loading: false, showDeleteBtn: true })
      const proto = protobuf(response)
      const buff = geobuf.decode(proto)
      const geojson = factory.geoJSON(buff, apConfig.pathOptions)
      const layers = geojson.getLayers()
      if (Array.isArray(layers) && layers.length > 0) {
        layers.forEach(layer => {
          layer.addTo(Map)
          layer.feature.properties.DESCRIPTOR = 'SEARCHED_LPIS_PARCEL'
          setSearchedParcelLabel(layer)
          Map.fitBounds(layer.getBounds())
        })
      } else {
        alertUser(true, 'info', 'Не се пронајдени СИЗП парцели')
      }
    }).catch(err => {
      console.error(err)
      setState({ loading: false })
      const stringfiedResponse = bufferToString(err.response.data)
      if (strcmp(typeof stringfiedResponse, 'string')) {
        if (stringfiedResponse.includes('err.no_parcel.found')) {
          const translatedError = 'Не се пронајдени парцели'
          alertUser(true, 'info', translatedError)
        } else {
          alertUser(true, 'error', 'Настана грешка')
        }
      } else {
        alertUser(true, 'error', 'Настана грешка')
      }
    })
  }

  const onChange = ({ formData }) => {
    setState({ data: { ...data, ...formData } });
  }

  const onDeleteBtnClick = () => {
    setState({ showDeleteBtn: false })
    removeSearchedParcels()
  }

  const renderComponent = () => {
    const componentToRender = (
      <Form
        isSimple
        formTitle='Пребарување СИЗП'
        buttonLabel='Пребарај'
        className='cadastre-search-form'
        schema={schema}
        uiSchema={uiSchema}
        formData={data}
        onSubmit={onSubmit}
        onChange={onChange}
        showDeleteBtn={showDeleteBtn}
        onDeleteFn={onDeleteBtnClick}
        deleteBtnLabel='Отстрани парцели'
        deleteBtnClassName='cancel lpis-search-form-delete-btn' >
        <DrawActions cancel={disable} />
      </Form>
    )

    return componentToRender
  }

  return (
    <React.Fragment>
      <Button variant='dark' className='mt-1' onClick={toggleSearchForm}>Пребарај СИЗП</Button>
      {showForm && renderComponent()}
      {loading && <Loading />}
    </React.Fragment>
  )
}

export const LpisSearch = connect(state =>
  ({ actionType: state.farmRegistry?.actionType, theSearchedParcelWasRemoved: state.farmRegistry?.theSearchedParcelWasRemoved }))(_LpisSearch)
