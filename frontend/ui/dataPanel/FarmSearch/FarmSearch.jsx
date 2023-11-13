import { React, PropTypes, elements } from 'perun-core';
import { core } from '../../../Spatial';
import FarmSearchForm from './FarmSearchForm';
import FarmSearchTable from './FarmSearchTable';

const { http, store, connect } = core;
const { ReactBootstrap, alertUser } = elements;
const { Spinner } = ReactBootstrap;
const { useReducer } = React;

const FarmSearch = ({ farmSearchFormData, farmSearchData }) => {
  const [{ loading }, setState] = useReducer((currState, update) => ({ ...currState, ...update }), { loading: false });

  const onChange = ({ formData }) => {
    store.dispatch({ farmSearchFormData: { ...farmSearchFormData, ...formData } })
  }

  const onSubmit = () => {
    store.dispatch({ farmSearchData: undefined })
    setState({ loading: true })
    // Convert the form data values to uppercase
    const formData = JSON.parse(JSON.stringify(farmSearchFormData))
    Object.keys(formData).map(k => formData[k] = formData[k].toUpperCase())
    http.call('search_farm', {
      method: 'post',
      url: `/ReactElements/searchTable/{init.token}/FARM/0`,
      data: JSON.stringify(formData),
    }).then(response => {
      setState({ loading: false })
      if (response.data) {
        store.dispatch({ farmSearchData: response.data })
      }
    }).catch(err => {
      console.error(err)
      setState({ loading: false })
      const title = err.response?.data?.title || err
      const message = err.response?.data?.message || ''
      alertUser(true, 'error', title, message)
    })
  }

  return (
    <div>
      <FarmSearchForm onChange={onChange} onSubmit={onSubmit} formData={farmSearchFormData} loading={loading} />
      {farmSearchData && <FarmSearchTable farmData={farmSearchData} />}
      {loading && (
        <div className='farm-search-loader-container'>
          <Spinner animation='border' variant='secondary' />
        </div>
      )}
    </div>
  )
}

FarmSearch.propTypes = {
  farmSearchFormData: PropTypes.object,
  farmSearchData: PropTypes.array,
}

export default connect(state => ({
  farmSearchFormData: state.lpis?.farmSearchFormData,
  farmSearchData: state.lpis?.farmSearchData,
}))(FarmSearch)
