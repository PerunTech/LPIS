import { React, elements } from 'perun-core'
import { translateBooleanValue, translateLandCoverCode } from '../../../../Util';
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

  return <ListGroup className='text-center mb-2' style={{ height: '650px' }}>
    <ListGroupItem className='p-2'>
      Целосно име: <span className='font-weight-bold'>{farmInfo?.FULL_NAME || '/'}</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      ИДБР: <span className='font-weight-bold'>{farmInfo?.FIC || '/'}</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Подрачна единица: <span className='font-weight-bold'>{farmInfo?.ORG_UNIT_NAME || '/'}</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      СИЗП број: <span className='font-weight-bold'>{parcelInfo.OLD_ID}</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Употреба на земјиште: <span className='font-weight-bold'>{translatedLandCoverCode}</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Место викано: <span className='font-weight-bold'>{parcelInfo.HOME_NAME || 'Не е наведено'}</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Површина: <span className='font-weight-bold'>{`${Math.round(Number(parcelInfo.ALLOWED_AREA || parcelInfo.AREA))} m²`}</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Вкупна површина: <span className='font-weight-bold'>{Math.round(parcelInfo.AREA)} m²</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Заедничка употреба: <span className='font-weight-bold'>{translateBooleanValue(parcelInfo.COMMON_USE)}</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Право на користење: <span className='font-weight-bold'>{translateBooleanValue(parcelInfo.CERTIFICATE_OF_USE)}</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Забелешка од оператор:
      <br />
      <span className='font-weight-bold'>{parcelInfo.NOTE_INSERT || '/'}</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Забелешка од земјоделец:
      <br />
      <span className='font-weight-bold'>{parcelInfo.NOTE_FARMER || '/'}</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Забелешка од организација:
      <br />
      <span className='font-weight-bold'>{parcelInfo.NOTE_ORGANISATION || '/'}</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Преклоп: <span className='font-weight-bold'>{translateBooleanValue(parcelInfo.HAS_OVERLAP)}</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Тераси: <span className='font-weight-bold'>{translateBooleanValue(parcelInfo.TERRACE)}</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Наводнување: <span className='font-weight-bold'>{translateBooleanValue(parcelInfo.IRRIGATION)}</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Пејсажни обележја: <span className='font-weight-bold'>{translateBooleanValue(parcelInfo.LANDSCAPE_FEATURES)}</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Невидлива граница: <span className='font-weight-bold'>{translateBooleanValue(parcelInfo.INVISIBLE_BORDER)}</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Променета граница: <span className='font-weight-bold'>{translateBooleanValue(parcelInfo.CHANGED_BORDER)}</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Експозиција: <span className='font-weight-bold'>{parcelInfo.EXPOSITION_AVG}</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Наклон: <span className='font-weight-bold'>{parcelInfo.SLOPE_AVG}</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Надморска височина: <span className='font-weight-bold'>{Math.round(parcelInfo.Z_AVG)} m</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Коефициент на искористена површина:
      <ProgressBar now={parcelInfo.ELIGIBILITY_COEF} label={`${parcelInfo.ELIGIBILITY_COEF}%`} />
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Органско производство: <span className='font-weight-bold'>{translateBooleanValue(parcelInfo.ORGANIC)}</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Тип на почва: <span className='font-weight-bold'>{parcelInfo.SOIL_TYPE || 'Не е наведено'}</span>
    </ListGroupItem>
    <ListGroupItem className='p-2'>
      Корисничко име: <span className='font-weight-bold'>{finalUserName}</span>
    </ListGroupItem>
  </ListGroup>
}
