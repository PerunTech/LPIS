import { React, elements } from 'perun-core'
import { core, ui } from '../../../../../Spatial';
import { InfoListGroup } from './InfoListGroup';

const { http } = core;
const { Button } = ui;
const { alertUser, ReactBootstrap } = elements;
const { useReducer } = React;
const { Spinner, ListGroup } = ReactBootstrap;
const { Item: ListGroupItem } = ListGroup;

export const InfoList = ({ farmInfo, parcelInfo }) => {
  const [{ loadingOverlaps, overlaps }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }), { overlaps: undefined });

  const getCommonUse = () => {
    const parcelId = parcelInfo.object_id
    const url = `/lpis/get/commonUse/{init.token}/0/${parcelId}`
    http.call('get-common-use', { url }).then(res => {
      if (res.data && Object.keys(res.data).length > 0) {
        if (Array.isArray(res.data.items) && res.data.items?.length > 0) {
          console.log(res.data.items)
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

  const getOverlaps = () => {
    setState({ loadingOverlaps: true })
    const parcelId = parcelInfo.object_id
    const url = `/lpis/get/overlaps/{init.token}/${parcelId}`
    http.call('get-overlaps', { url }).then(res => {
      setState({ loadingOverlaps: false })
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
      setState({ loadingOverlaps: false })
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

  const componentToRender = () => {
    return <React.Fragment>
      {parcelInfo.COMMON_USE && <Button className='mb-3 p-2 info' onClick={getCommonUse}>
        Информации за заедничка употреба
      </Button>}
      {parcelInfo.HAS_OVERLAP && !overlaps && <Button className='mb-3 p-2 info' onClick={getOverlaps}>
        Информации за преклопи
      </Button>}
      {loadingOverlaps && <div className='mt-n2'><Spinner animation='grow' /></div>}
      {overlaps && Array.isArray(overlaps) && overlaps.length > 0 && <div id='overlaps' className='mb-2'>
        <p className='font-weight-bold' style={{ marginBottom: '0', textDecoration: 'underline' }}>Преклопи</p>
        {overlapsContainer()}
      </div>}
      <InfoListGroup farmInfo={farmInfo} parcelInfo={parcelInfo} />
    </React.Fragment>
  }

  return componentToRender()
}
