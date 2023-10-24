import { React, elements } from 'perun-core'
import { getLabel, getMeasurementUnit, translateBooleanValue, translateLandCoverCode } from '../../../../Util';
import { truncate } from '../../../../dataPanel/Util';

const { ReactBootstrap } = elements;
const { ListGroup, ProgressBar } = ReactBootstrap;
const { Item: ListGroupItem } = ListGroup;

export const InfoListGroup = ({ farmInfo, parcelInfo }) => {
  const translatedLandCoverCode = translateLandCoverCode(parcelInfo.LAND_COVER_CODE)
  let finalUserName = farmInfo?.FULL_NAME || '/'
  const userName = parcelInfo.USER_NAME
  const userId = parcelInfo.USER_ID
  if (userName && (typeof userName === 'string' || userName instanceof String)) {
    finalUserName = truncate(userName, 20, true)
  } else if (userId && (typeof userId === 'string' || userId instanceof String)) {
    finalUserName = truncate(userId, 20, true)
  }

  return (
    <ListGroup className='text-center mb-2'>
      <ListGroupItem className='p-2'>
        {getLabel('full_name')}: <span className='font-weight-bold'>{farmInfo?.FULL_NAME || '/'}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('id_number')}: <span className='font-weight-bold'>{farmInfo?.FIC || '/'}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('org_unit_name')}: <span className='font-weight-bold'>{farmInfo?.ORG_UNIT_NAME || '/'}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('lpis_number')}: <span className='font-weight-bold'>{parcelInfo.OLD_ID}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('land_use_translated')}: <span className='font-weight-bold'>{translatedLandCoverCode}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('locality')}: <span className='font-weight-bold'>{parcelInfo.HOME_NAME || 'Не е наведено'}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('area')}: <span className='font-weight-bold'>{`${Math.round(Number(parcelInfo.ALLOWED_AREA || parcelInfo.AREA))}${getMeasurementUnit(true)}`}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('total_area')}: <span className='font-weight-bold'>{Math.round(parcelInfo.AREA)} {getMeasurementUnit(true)}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('common_use')}: <span className='font-weight-bold'>{translateBooleanValue(parcelInfo.COMMON_USE)}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('certificiate_of_use')}: <span className='font-weight-bold'>{translateBooleanValue(parcelInfo.CERTIFICATE_OF_USE)}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('note')}:
        <br />
        <span className='font-weight-bold'>{parcelInfo.NOTE_INSERT || '/'}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('farmer_note')}:
        <br />
        <span className='font-weight-bold'>{parcelInfo.NOTE_FARMER || '/'}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('organization_note')}:
        <br />
        <span className='font-weight-bold'>{parcelInfo.NOTE_ORGANISATION || '/'}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('overlap')}: <span className='font-weight-bold'>{translateBooleanValue(parcelInfo.HAS_OVERLAP)}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('terrace')}: <span className='font-weight-bold'>{translateBooleanValue(parcelInfo.TERRACE)}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('irrigation')}: <span className='font-weight-bold'>{translateBooleanValue(parcelInfo.IRRIGATION)}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('landscape_features')}: <span className='font-weight-bold'>{translateBooleanValue(parcelInfo.LANDSCAPE_FEATURES)}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('invisible_border')}: <span className='font-weight-bold'>{translateBooleanValue(parcelInfo.INVISIBLE_BORDER)}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('changed_border')}: <span className='font-weight-bold'>{translateBooleanValue(parcelInfo.CHANGED_BORDER)}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('exposition_avg')}: <span className='font-weight-bold'>{parcelInfo.EXPOSITION_AVG}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('slope_avg')}: <span className='font-weight-bold'>{parcelInfo.SLOPE_AVG}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('z_avg')}: <span className='font-weight-bold'>{Math.round(parcelInfo.Z_AVG)} m</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('eligibility_coef')}:
        <ProgressBar now={parcelInfo.ELIGIBILITY_COEF} label={`${parcelInfo.ELIGIBILITY_COEF}%`} />
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('organic')}: <span className='font-weight-bold'>{translateBooleanValue(parcelInfo.ORGANIC)}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('soil_type')}: <span className='font-weight-bold'>{parcelInfo.SOIL_TYPE || 'N/A'}</span>
      </ListGroupItem>
      <ListGroupItem className='p-2'>
        {getLabel('user_name')}: <span className='font-weight-bold'>{finalUserName}</span>
      </ListGroupItem>
    </ListGroup>
  )
}
