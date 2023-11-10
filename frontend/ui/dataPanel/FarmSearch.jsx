import { React } from 'perun-core';
import { ui } from '../../Spatial';
import { getLabel } from '../Util';

const { Button } = ui;
const { useReducer } = React;

export const FarmSearch = () => {
  const [{ farmName }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }), { farmName: '' });

  const onSubmit = (e) => {
    e.preventDefault()
  }

  return (
    <div>
      <form onChange={(e) => setState({ [e.target.name]: e.target.value })} onSubmit={onSubmit} className='farm-search-form'>
        <div className='form-group'>
          <label htmlFor='farmName'>{getLabel('farm_name')}</label>
          <input type='text' name='farmName' id='farmName' className='form-control' required value={farmName} />
        </div>
        <div className='farm-search-btn-container'>
          <Button type='submit' className='farm-search-btn' size=''>{getLabel('search')}</Button>
        </div>
      </form>
    </div>
  )
}
