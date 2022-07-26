import { React, Loading, elements } from 'perun-core';
import { core, ui } from '../../../../Spatial';
import { physicalBlockInfoMsg } from '../Config';
import { ProcessButton } from '../../ProcessButton';
import { Guidance } from '../../agriParcel/Guidance';
import { InfoList } from './InfoList';

const { Map, store, http } = core;
const { Icon, Modal, Button, DrawActions } = ui;
const { alertUser } = elements;
const { useReducer } = React;
const _id = 'help';

const _Info = ({ processID }) => {
  const [{ isGuided, loading, pbInfo, showModal }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { isGuided: false, loading: false, pbInfo: {}, showModal: false });

  const enable = () => {
    setState({ isGuided: true })
    store.dispatch({ processID: _id });
    Map.on('click', (e) => {
      const p = Map.transform(e.latlng);
      setState({ X: p.x, Y: p.y, loading: true });
      const url = `/lpis/info/physicalBlock/{init.token}/PHYSICAL_BLOCK/${p.x}/${p.y}`
      http.call('get-physical-block-info', { url }).then((response) => {
        setState({ loading: false })
        if (response.data && Object.keys(response.data).length > 0) {
          setState({ isGuided: false, loading: false, pbInfo: response.data, showModal: true })
        } else {
          alertUser(true, 'info', 'Нема податоци за избраниот физички блок или не е избран физички блок од мапата');
          disable()
        }
      }).catch((err) => {
        console.log(err);
        alertUser(true, 'info', 'Нема податоци за избраниот физички блок или не е избран физички блок од мапата');
        disable();
      });

      Map.off('click');
    });
  };

  const disable = () => {
    Map.off('click');
    // Reset state, internal and application-wide.
    setState({ loading: false, isGuided: false, showModal: false, pbInfo: {} });
    store.dispatch({ processID: '' });
  };

  const renderGuideForm = () => {
    return <Guidance id={_id} disable={disable} msg={physicalBlockInfoMsg} title='Информации за физички блок' />
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
        <Button disabled className='as-label ap-modal-title' >Информации за физички блок</Button>
        <DrawActions cancel={disable} />
      </Modal.Title>
      <Modal.Body className='parcel-info-modal-body'>
        <InfoList pbInfo={pbInfo} />
      </Modal.Body>
    </Modal>
  }

  const renderComponent = () => {
    let componentToRender = null

    if (isGuided && !showModal) {
      componentToRender = renderGuideForm()
    } else if (showModal && !isGuided) {
      componentToRender = renderModal()
    }

    return componentToRender
  }

  return (
    <ProcessButton id={_id} onClick={enable} title='Информации за физички блок'>
      <Icon name={_id} size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>Информации</span>
      {processID === _id && renderComponent()}
      {loading && <Loading />}
    </ProcessButton>
  )
};

export const Info = core.connect((state) => ({ processID: state.app.processID }))(_Info);
