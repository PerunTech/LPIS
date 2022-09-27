import { React, elements } from 'perun-core'
import { core, ui } from '../../../../../Spatial';
import { permanentCropSchema } from '../../Config';
import { InfoListGroup } from './InfoListGroup';

const { http, connect } = core;
const { Button } = ui;
const { alertUser, ReactBootstrap } = elements;
const { useEffect, useReducer } = React;
const { ListGroup } = ReactBootstrap;
const { Item: ListGroupItem } = ListGroup;

const _InfoList = ({ farmInfo, parcelInfo }) => {
  const [{ overlaps, commonUses, canHavePermanentCrops, permanentCrops }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }), { overlaps: undefined, commonUses: undefined, canHavePermanentCrops: false, permanentCrops: undefined });

  useEffect(() => {
    const landCoverCode = parcelInfo.LAND_COVER_CODE
    if (Number(landCoverCode) >= 400 && Number(landCoverCode) < 500) {
      setState({ canHavePermanentCrops: true })
    }
  }, [])

  useEffect(() => {
    if (farmInfo && parcelInfo) {
      setState({ overlaps: undefined, commonUses: undefined, permanentCrops: undefined })
      const landCoverCode = parcelInfo.LAND_COVER_CODE
      if (Number(landCoverCode) >= 400 && Number(landCoverCode) < 500) {
        setState({ canHavePermanentCrops: true })
      } else {
        setState({ canHavePermanentCrops: false })
      }
    }
  }, [farmInfo, parcelInfo])

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
    return <div className='text-center'>
      Парцелата има заедничка употреба со следниве стопанства
      {commonUses.map(commonUse => {
        return <ListGroup className='text-center mb-2' key={commonUse.object_id}>
          <ListGroupItem className='p-2'>
            Целосно име: <span className='font-weight-bold mr-1'>{commonUse.FULL_NAME}</span>
          </ListGroupItem>
          <ListGroupItem className='p-2'>
            ИДБР: <span className='font-weight-bold'>{commonUse.FIC}</span>
          </ListGroupItem>
          <ListGroupItem className='p-2'>
            Површина: <span className='font-weight-bold'>{Math.round(commonUse.ALLOWED_AREA)} m²</span>
          </ListGroupItem>
        </ListGroup>
      })}
      <hr />
    </div>
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
    const schema = permanentCropSchema.schema
    return <ListGroup className='text-center '>
      На парцелата се декларирани следниве долгогодишни култури
      {permanentCrops.map(permanentCrop => {
        const numberOfTreesLabel = Number(permanentCrop.NUMBER_OF_TREES) === 1 ? 'садница' : 'садници'
        return <ListGroupItem className='p-2'>
          <span className='mr-1'>{schema.properties.PERM_CROP_TYPE_ID.enumNames[Number(permanentCrop.PERM_CROP_TYPE_ID) - 1]}</span>
          <span>(<strong>{permanentCrop.NUMBER_OF_TREES}</strong> {numberOfTreesLabel}</span>
          <span className='mr-1'> на <strong>{Math.round(permanentCrop.PLANT_AREA)}</strong> m²)</span>
        </ListGroupItem>
      })}
    </ListGroup>
  }

  const componentToRender = () => {
    return (
      <React.Fragment>
        {farmInfo && parcelInfo ?
          <div className='mt-2 text-center border-top selected-parcel-info'>
            {parcelInfo && parcelInfo.COMMON_USE && <Button className='mt-1 mb-1 p-2 info' onClick={getCommonUse}>
              Информации за заедничка употреба
            </Button>}
            {commonUses && Array.isArray(commonUses) && commonUses.length > 0 && <div id='commonUses' className='mb-2'>
              <p className='font-weight-bold' style={{ marginBottom: '0', textDecoration: 'underline' }}>Заедничка употреба</p>
              {commonUsesContainer()}
            </div>}
            {parcelInfo && parcelInfo.HAS_OVERLAP && !overlaps && <Button className='mt-1 mb-1 p-2 info' onClick={getOverlaps}>
              Информации за преклопи
            </Button>}
            {overlaps && Array.isArray(overlaps) && overlaps.length > 0 && <div id='overlaps' className='mb-2'>
              <p className='font-weight-bold' style={{ marginBottom: '0', textDecoration: 'underline' }}>Преклопи</p>
              {overlapsContainer()}
            </div>}
            {canHavePermanentCrops && !permanentCrops && <Button className='mt-1 mb-1 p-2 info' onClick={getPermanentCrops}>
              Информации за долгогодишни култури
            </Button>}
            {permanentCrops && Array.isArray(permanentCrops) && permanentCrops.length > 0 && <div id='permanentCrops' className='mb-2'>
              <p className='font-weight-bold' style={{ marginBottom: '0', textDecoration: 'underline' }}>Долгогодишни култури</p>
              {permanentCropsContainer()}
            </div>}
            <InfoListGroup farmInfo={farmInfo} parcelInfo={parcelInfo} />
          </div> : <div className='mt-2 text-center'>Нема информации</div>}
      </React.Fragment>
    )
  }

  return componentToRender()
}

export const InfoList = connect(state => ({
  farmInfo: state.farmRegistry?.farmInfo, parcelInfo: state.farmRegistry?.parcelInfo,
}))(_InfoList)
