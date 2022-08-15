import { React, Loading, elements } from 'perun-core';
import { core, ui } from '../../../../../Spatial';
import { parcelInfoMsg } from '../../Config';
import { ProcessButton } from '../../../ProcessButton';
import { Guidance } from '../../Guidance';
import { InfoList } from './InfoList';
import { strcmp } from '../../../../Util';

const { Map, store, http } = core;
const { Icon, Modal, Button, DrawActions } = ui;
const { alertUser } = elements;
const { useReducer } = React;
const _id = 'help';

const _Info = ({ processID }) => {
  const [{ isGuided, loading, farmInfo, parcelInfo, showModal }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { isGuided: false, loading: false, farmInfo: {}, parcelInfo: {}, showModal: false });

  const enable = () => {
    setState({ isGuided: true, showModal: false })
    store.dispatch({ processID: _id });
    Map.on('click', (e) => {
      const p = Map.transform(e.latlng);
      setState({ X: p.x, Y: p.y, loading: true });
      store.dispatch({ farmInfo: undefined, parcelInfo: undefined })
      const url = `/lpis/info/agriParcel/{init.token}/AGRI_PARCEL/${p.x}/${p.y}`
      http.call('get-parcel-info', { url }).then((response) => {
        if (response.data.items && Array.isArray(response.data.items) && response.data?.items.length >= 1) {
          let farmInfo
          let parcelInfo
          response.data.items.forEach(item => {
            if (item.FIC) {
              farmInfo = item
            }
            if (strcmp(item.DESCRIPTOR, 'AGRI_PARCEL') || (item.ALLOWED_AREA || item.AREA)) {
              parcelInfo = item
            }
          })
          setState({ isGuided: false, loading: false, farmInfo, parcelInfo, showModal: true })
          store.dispatch({ farmInfo, parcelInfo, showParcelInfoContainer: true, processID: '' })
        } else {
          alertUser(true, 'info', 'Нема податоци за избраната парцела или не е избрана парцела од мапата');
          store.dispatch({ showParcelInfoContainer: false })
          disable();
        }
      }).catch((err) => {
        console.log(err);
        alertUser(true, 'info', 'Нема податоци за избраната парцела или не е избрана парцела од мапата');
        store.dispatch({ showParcelInfoContainer: false })
        disable();
      });

      Map.off('click');
    });
  };

  const disable = () => {
    Map.off('click');
    // Reset state, internal and application-wide.
    setState({ loading: false, isGuided: false, showModal: false, farmInfo: {}, parcelInfo: {} });
    store.dispatch({ processID: '' });
  };

  const renderGuideForm = () => {
    return <Guidance id={_id} disable={disable} msg={parcelInfoMsg} title='Информации за парцела' />
  }

  const renderModal = () => {
    const modalProps = {
      show: true,
      backdrop: false,
      enforceFocus: false,
      id: 'measure-dialog',
      className: 'parcel-info-modal',
      container: document.getElementsByClassName('control-map')[0]
    }

    return <Modal {...modalProps}>
      <Modal.Title>
        <Button disabled className='as-label ap-modal-title' >Информации за парцела</Button>
        <DrawActions cancel={disable} />
      </Modal.Title>
      <Modal.Body className='parcel-info-modal-body'>
        <InfoList farmInfo={farmInfo} parcelInfo={parcelInfo} />
      </Modal.Body>
    </Modal>
  }

  const renderComponent = () => {
    let componentToRender = null

    if (isGuided && !showModal) {
      componentToRender = renderGuideForm()
    } else if (showModal && !isGuided) {
      componentToRender = null
    }

    return componentToRender
  }

  return (
    <ProcessButton id={_id} onClick={enable} title='Информации за парцела'>
      <Icon name={_id} size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>Информации</span>
      {processID === _id && renderComponent()}
      {loading && <Loading />}
    </ProcessButton>
  )
};

export const Info = core.connect((state) => ({ processID: state.app.processID, farmObjId: state.farmRegistry?.farmObjId }))(_Info);
