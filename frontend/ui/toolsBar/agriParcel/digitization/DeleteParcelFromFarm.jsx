import { React, Loading, elements } from 'perun-core';
import { core, ui } from '../../../../Spatial';
import { deleteAPFromFarmMsg } from '../Config';
import { getFarmMapAssets, getLabel, getMeasurementUnit } from '../../../Util';
import { Guidance } from '../Guidance';
import { ProcessButton } from '../../ProcessButton';

const { store, http } = core;
const { Button, Icon, DrawActions, Modal } = ui;
const { alertUser } = elements;
const { useReducer } = React;
const _id = 'cropDelete';
const _processID = 'deleteAPFromFarm';

const _DeleteParcelFromFarm = ({ processID, farmObjId }) => {
  const [{ isGuided, layer, loading }, setState] = useReducer(
    (currState, update) => ({ ...currState, ...update }), { isGuided: false, layer: {}, loading: false }
  );

  const deleteParcelFromFarm = () => {
    disable()
    setState({ loading: true })
    const url = `/lpis/remove/farm/{init.token}/${layer.feature.id}/AGRI_PARCEL/${farmObjId}`
    http.call(_id, { url }).then(res => {
      setState({ loading: false })
      const type = res.data.type?.toLowerCase() || 'success'
      alertUser(true, type, 'Успешно бришење', 'Парцелата е отстранета од фармата', disable);
    }).catch(err => {
      console.error(err)
      setState({ loading: false })
      alertUser(true, 'error', 'Грешка при бришење', 'Парцелата не е отстранета од фармата', disable);
    });
  };

  const enable = () => {
    if (!loading) {
      const layers = Object.values(store.getState().farmRegistry?.agriParcels);
      if (layers.length > 0) {
        store.dispatch({ processID: _processID });
        setState({ isGuided: true });
        layers.forEach((sc) => {
          sc.bringToFront();
          sc.on('click', function (e) {
            setState({ layer: e.target, isGuided: false });
          });
        });
      } else {
        alertUser(true, 'warning', `${getLabel('no_parcels_found')}`, `${getLabel('add_parcels_before_using_delete_parcel_from_farm_tool')}`);
      }
    }
  };

  const disable = () => {
    // Reset state, internal and application-wide.
    store.dispatch({ processID: '', selectedParcelId: '' });
    setState({ isGuided: false, layer: {}, loading: false });
    getFarmMapAssets();
  };

  const renderGuideForm = () => {
    return <Guidance id={_processID} disable={disable} msg={deleteAPFromFarmMsg} title={getLabel('remove_parcel_from_farm')} />
  }

  const renderModal = () => {
    const container = document.getElementsByClassName('control-map')[0]
    return (
      <Modal show backdrop={false} enforceFocus={false} id='measure-dialog' className='delete-control-dialog' container={container}>
        <Modal.Title>
          <Button disabled className='as-label ap-modal-title'>{getLabel('remove_parcel_from_farm')}</Button>
          <DrawActions cancel={disable} />
        </Modal.Title>
        <Modal.Body className='ap-modal-body'>
          <div id={_id}>
            {'Ја избравте парцелата со СИЗП број ' +
              layer.feature.properties.OLD_ID +
              ' и површина ' +
              Math.round(layer.getMeasurement()) +
              ` ${getMeasurementUnit(true)}. Дали сте сигурни дека сакате да ја отстраните од фармата?`}
          </div>
          <Button onClick={deleteParcelFromFarm} size='' className='cancel'>{getLabel('remove')}</Button>
        </Modal.Body>
      </Modal>
    )
  }

  const renderComponent = () => {
    let component = null

    if (isGuided) {
      component = renderGuideForm()
    } else {
      component = renderModal()
    }

    return component
  }

  return (
    <ProcessButton id={_processID} onClick={() => enable()}>
      <Icon name={_id} size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('remove_parcel')}</span>
      {processID === _processID && renderComponent()}
      {loading && <Loading />}
    </ProcessButton>
  );
};

export const DeleteParcelFromFarm = core.connect((state) => ({
  processID: state.app.processID, farmObjId: state.farmRegistry?.farmObjId
}))(_DeleteParcelFromFarm);
