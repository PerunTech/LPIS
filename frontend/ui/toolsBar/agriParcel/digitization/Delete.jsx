import { React, elements } from 'perun-core';
import { core, ui } from '../../../../Spatial';
import { deleteAPMsg } from '../Config';
import { getFarmMapAssets, getLabel } from '../../../Util';
import { Guidance } from '../Guidance';
import { ProcessButton } from '../../ProcessButton';

const { Map, store, http } = core;
const { Button, Icon, DrawActions, Modal } = ui;
const { alertUser } = elements;
const { useReducer } = React;
const _id = 'deleteAP';

const _Delete = ({ processID }) => {
  const [{ isGuided, layer }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }), { isGuided: false, layer: {} });

  const deleteLayer = () => {
    http.call(_id, {
      url: '/lpis/lpis/delete/{init.token}/' + Number(layer.feature.id) + '/' + Number(layer.feature.properties.type),
      method: 'post',
      data: JSON.stringify({
        ...layer.feature.properties,
        OBJECT_ID: Number(layer.feature.id),
        OBJECT_TYPE: Number(layer.feature.properties.type)
      })
    }).then(() => {
      layer.removeFrom(Map);
      alertUser(true, 'success', `${getLabel('delete_success')}`, `${getLabel('parcel_delete_success')}`);
      disable()
    }).catch(() => {
      alertUser(true, 'error', `${getLabel('delete_error')}`, `${getLabel('parcel_delete_error')}`);
      disable()
    })
  }

  const enable = () => {
    const layers = Object.values(store.getState().farmRegistry?.agriParcels);
    if (layers.length > 0) {
      store.dispatch({ processID: _id });
      setState({ isGuided: true })

      layers.forEach(sc => {
        sc.bringToFront();
        sc.on('click', function (e) {
          setState({ layer: e.target, isGuided: false })
        })
      });
    } else {
      elements.alertUser(true,
        'warning',
        `${getLabel('no_parcels_found')}`,
        `${getLabel('add_parcels_before_using_delete_tool')}`);
    }
  }

  const disable = () => {
    // Reset state, internal and application-wide.
    store.dispatch({ processID: '', selectedParcelId: '' });
    setState({ isGuided: false, layer: {} });
    getFarmMapAssets();
  }

  return <ProcessButton id={_id} onClick={() => enable()} title={getLabel('delete_agricultural_parcel')}>
    <Icon name={_id} size='30px' />
    <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('delete')}</span>
    {processID === _id
      && (isGuided
        ? <Guidance id={_id} disable={disable} msg={deleteAPMsg} title={getLabel('delete_agricultural_parcel')} />
        : <Modal id='measure-dialog'
          className='delete-control-dialog'
          show
          backdrop={false}
          enforceFocus={false}
          container={document.getElementsByClassName('control-map')[0]} >
          <Modal.Title>
            <Button disabled className='as-label ap-modal-title' >{getLabel('delete_agricultural_parcel')}</Button>
            <DrawActions cancel={disable} />
          </Modal.Title>
          <Modal.Body className='ap-modal-body' >
            <div id={_id} >{`${getLabel('delete_agricultural_parcel_msg_one')} `
              + layer.feature.properties.OLD_ID + ` ${getLabel('delete_agricultural_parcel_msg_two')} ` + Math.round(layer.getMeasurement()) + ' m². '
              + ` ${getLabel('delete_agricultural_parcel_confirmation')} `}</div>
            <Button onClick={() => { deleteLayer() }} size='' className='cancel' > {getLabel('delete')}</Button>
          </Modal.Body>
        </Modal>)}
  </ProcessButton>;
};

export const Delete = core.connect(state => ({
  processID: state.app.processID, mapId: state.map.id, farmObjId: state.farmRegistry?.farmObjId
}))(_Delete)
