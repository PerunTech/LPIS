import { React } from 'perun-core'
import { getLabel } from '../Util'

export const FarmDataGridNumOfParcels = ({ rows }) => {
  const numOfParcels = Object.keys(rows).length

  return (
    <div className='text-center num-of-parcels'>{getLabel('num_of_parcels')}: <strong>{numOfParcels}</strong></div>
  )
}
