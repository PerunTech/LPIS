import { React } from 'perun-core'

export const FarmDataGridNumOfParcels = ({ rows }) => {
  const numOfParcels = Object.keys(rows).length

  return (
    <div className='text-center num-of-parcels'>Вкупен број на парцели: <strong>{numOfParcels}</strong></div>
  )
}
