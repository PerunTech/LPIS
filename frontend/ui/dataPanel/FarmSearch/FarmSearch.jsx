import { React, elements } from 'perun-core';
import { core } from '../../../Spatial';
import FarmSearchForm from './FarmSearchForm';

const { http } = core;
const { alertUser } = elements;
const { useReducer } = React;

const FarmSearch = () => {
  const [{ data }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }), { data: {} });

  const onChange = ({ formData }) => {
    setState({ data: { ...data, ...formData } });
  }

  const onSubmit = () => {
    // Convert the form data values to uppercase
    Object.keys(data).map(k => data[k] = data[k].toUpperCase())
    http.call('search_farm', {
      method: 'post',
      url: `/ReactElements/searchTable/{init.token}/FARM/0`,
      data: JSON.stringify(data),
    }).then(response => {
      console.log(response)
    }).catch(err => {
      console.error(err)
      alertUser(true, 'error', err)
    })
  }

  return (
    <div>
      <FarmSearchForm onChange={onChange} onSubmit={onSubmit} formData={data} />
    </div>
  )
}

export default FarmSearch
