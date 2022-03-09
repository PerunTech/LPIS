import { React, elements } from 'perun-core'
import { core, ui } from '../../../../../Spatial';
import { InfoListGroup } from './InfoListGroup';

const { http } = core;
const { Button } = ui;
const { alertUser, ReactBootstrap } = elements;
const { useReducer } = React;
const { ListGroup } = ReactBootstrap;
const { Item: ListGroupItem } = ListGroup;

export const InfoList = ({ farmInfo, parcelInfo }) => {
  const [{ overlaps, commonUses, permanentCrops }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }), { overlaps: undefined, commonUses: undefined, permanentCrops: undefined });

  const getCommonUse = () => {
    const parcelId = parcelInfo.object_id
    const url = `/lpis/get/commonUse/{init.token}/0/${parcelId}`
    http.call('get-common-use', { url }).then(res => {
      if (res.data && Object.keys(res.data).length > 0) {
        if (Array.isArray(res.data.items) && res.data.items?.length > 0) {
          setState({ commonUses: res.data.items })
        } else {
          alertUser(true, 'info', 'Не се пронајдени податоци за Заедничка употреба')
        }
      } else {
        alertUser(true, 'info', 'Не се пронајдени податоци за Заедничка употреба')
      }
    }).catch(err => {
      console.error(err)
      alertUser(true, 'error', 'Настана грешка')
    })
  }

  const commonUsesContainer = () => {
    return <ListGroup className='text-center '>
      Парцелата има заедничка употреба со следниве стопанства
      {commonUses.map(commonUse => {
        return <ListGroupItem className='p-2'>
          Целосно име: <span className='font-weight-bold mr-1'>{commonUse.FULL_NAME}</span>
          ИДБР: <span className='font-weight-bold'>{commonUse.FIC}</span>
        </ListGroupItem>
      })}
    </ListGroup>
  }

  const getOverlaps = () => {
    const parcelId = parcelInfo.object_id
    const url = `/lpis/get/overlaps/{init.token}/${parcelId}`
    http.call('get-overlaps', { url }).then(res => {
      if (res.data && Object.keys(res.data).length > 0) {
        if (Array.isArray(res.data.items) && res.data.items?.length > 0) {
          setState({ overlaps: res.data.items })
        } else {
          alertUser(true, 'info', 'Не се пронајдени податоци за преклопи')
        }
      } else {
        alertUser(true, 'info', 'Не се пронајдени податоци за преклопи')
      }
    }).catch(err => {
      console.error(err)
      alertUser(true, 'error', 'Настана грешка')
    })
  }

  const overlapsContainer = () => {
    return <ListGroup className='text-center '>
      Парцелата се преклопува со следните соседни парцели
      {overlaps.map(overlap => {
        return <ListGroupItem className='p-2'>
          Број на парцела: <span className='font-weight-bold mr-1'>{overlap.PARCEL_ID1}</span>
          Површина: <span className='font-weight-bold'>{Math.round(overlap.AREA)} m²</span>
        </ListGroupItem>
      })}
    </ListGroup>
  }

  const getPermanentCrops = () => {
    const parcelId = parcelInfo.object_id
    const url = `/lpis/get/permanentCrop/{init.token}/${parcelId}`
    http.call('get-permanent-crops', { url }).then(res => {
      if (res.data && Object.keys(res.data).length > 0) {
        if (Array.isArray(res.data.items) && res.data.items?.length > 0) {
          setState({ permanentCrops: res.data.items })
        } else {
          alertUser(true, 'info', 'Не се пронајдени податоци за долгогодишни култури')
        }
      } else {
        alertUser(true, 'info', 'Не се пронајдени податоци за долгогодишни култури')
      }
    }).catch(err => {
      console.error(err)
      alertUser(true, 'error', 'Настана грешка')
    })
  }

  const permanentCropsContainer = () => {
    return <ListGroup className='text-center '>
      На парцелата се декларирани следниве долгогодишни култури
      {permanentCrops.map(permanentCrop => {
        return <ListGroupItem className='p-2'>
          Број на парцела: <span className='font-weight-bold mr-1'>{permanentCrop.PARCEL_ID1}</span>
          Површина: <span className='font-weight-bold'>{Math.round(permanentCrop.AREA)} m²</span>
        </ListGroupItem>
      })}
    </ListGroup>
  }

  const componentToRender = () => {
    return <React.Fragment>
      {parcelInfo && parcelInfo.COMMON_USE && <Button className='mb-3 p-2 info' onClick={getCommonUse}>
        Информации за заедничка употреба
      </Button>}
      {commonUses && Array.isArray(commonUses) && commonUses.length > 0 && <div id='commonUses' className='mb-2'>
        <p className='font-weight-bold' style={{ marginBottom: '0', textDecoration: 'underline' }}>Заедничка употреба</p>
        {commonUsesContainer()}
      </div>}
      {parcelInfo && parcelInfo.HAS_OVERLAP && !overlaps && <Button className='mb-3 p-2 info' onClick={getOverlaps}>
        Информации за преклопи
      </Button>}
      {overlaps && Array.isArray(overlaps) && overlaps.length > 0 && <div id='overlaps' className='mb-2'>
        <p className='font-weight-bold' style={{ marginBottom: '0', textDecoration: 'underline' }}>Преклопи</p>
        {overlapsContainer()}
      </div>}
      {/* {parcelInfo.HAS_PERMANENT_CROP && !permanentCrops && <Button className='mb-3 p-2 info' onClick={getPermanentCrops}>
        Информации за долгогодишни култури
      </Button>}
      {permanentCrops && Array.isArray(permanentCrops) && permanentCrops.length > 0 && <div id='permanentCrops' className='mb-2'>
        <p className='font-weight-bold' style={{ marginBottom: '0', textDecoration: 'underline' }}>Долгогодишни култури</p>
        {permanentCropsContainer()}
      </div>} */}
      <InfoListGroup farmInfo={farmInfo} parcelInfo={parcelInfo} />
    </React.Fragment>
  }

  return componentToRender()
}
