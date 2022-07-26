import { React, elements } from 'perun-core'
import { translateLandCoverCode } from '../../../Util';

const { ReactBootstrap } = elements;
const { ListGroup } = ReactBootstrap;
const { Item: ListGroupItem } = ListGroup;

export const InfoList = ({ pbInfo }) => {
  const translatedLandCoverCode = translateLandCoverCode(String(pbInfo.LAND_USE_ID))
  return (
    <ListGroup className='text-center mb-2' style={{ height: '650px' }}>
      <ListGroupItem className='p-2'>
        СИЗП број: <span className='font-weight-bold'>{pbInfo.ID}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        Иницијален СИЗП број: <span className='font-weight-bold'>{pbInfo.ID_ILPIS}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        Површина: <span className='font-weight-bold'>{Math.round(pbInfo.AREA)} m²</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        Периметар: <span className='font-weight-bold'>{Math.round(pbInfo.PERIM)} m</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        Употреба на земјиште: <span className='font-weight-bold'>{translatedLandCoverCode}</span>
      </ListGroupItem>
    </ListGroup>
  )
}
