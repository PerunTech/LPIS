import { React, elements } from 'perun-core'
import { translateLandCoverCode } from '../Util';
import { getLabel, getMeasurementUnit } from '../../../Util';

const { ReactBootstrap } = elements;
const { ListGroup } = ReactBootstrap;
const { Item: ListGroupItem } = ListGroup;

export const InfoList = ({ pbInfo }) => {
  const translatedLandCoverCode = translateLandCoverCode(String(pbInfo.LAND_USE_ID))
  return (
    <ListGroup className='text-center mb-2' style={{ height: '650px' }}>
      <ListGroupItem className='p-2'>
        {getLabel('lpis_number')}: <span className='font-weight-bold'>{pbInfo.ID}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('initial_lpis_number')}: <span className='font-weight-bold'>{pbInfo.ID_ILPIS}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('area')}: <span className='font-weight-bold'>{Math.round(pbInfo.AREA)} {getMeasurementUnit(true)}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('perim')}: <span className='font-weight-bold'>{Math.round(pbInfo.PERIM)} {getMeasurementUnit()}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('land_use_translated')}: <span className='font-weight-bold'>{translatedLandCoverCode}</span>
      </ListGroupItem>
    </ListGroup>
  )
}
