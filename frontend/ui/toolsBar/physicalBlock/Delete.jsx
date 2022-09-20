import { React, elements } from 'perun-core';
import { core, ui } from '../../../Spatial';
import { Guidance } from '../agriParcel/Guidance';
import { ProcessButton } from '../ProcessButton';

const { Map, store, http } = core;
const { Button, Icon, DrawActions, Modal } = ui;
const { alertUser } = elements;
const { useReducer } = React;

const _id = 'deletePB';

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
      alertUser(true, 'success', 'Успешно бришење', 'Блокот е избришан од базата на податоци.');
      disable()
    }).catch(() => {
      alertUser(true, 'error', 'Грешка при бришење', 'Блокот не е избришан од базата на податоци.');
      disable()
    })
  }

  const enable = () => {
    alertUser(true,
      'warning',
      'Не се пронајдени физички блокови.',
      'Додадете физички блокови пред да ја користите алатката за бришење.');
  }

  const disable = () => {
    // Reset state, internal and application-wide.
    store.dispatch({ processID: '' });
    setState({ isGuided: false, layer: {} });
  }

  return <ProcessButton id={_id} onClick={() => enable()} title='Избриши блок'>
    <Icon name={_id} size='30px' />
    <span style={{ display: 'block', marginTop: '5px' }}>Избриши блок</span>
    {processID === _id
      && (isGuided
        ? <Guidance id={_id} disable={disable} msg={['Одберете земјоделска парцела на мапата која ќе се избрише од базата на податоци.', '']} title='Избриши блок' />
        : <Modal id='measure-dialog'
          className='delete-control-dialog'
          show
          backdrop={false}
          enforceFocus={false}
          container={document.getElementsByClassName('control-map')[0]} >
          <Modal.Title>
            <Button disabled className='as-label ap-modal-title' >Избриши блок</Button>
            <DrawActions cancel={disable} />
          </Modal.Title>
          <Modal.Body className='ap-modal-body' >
            <div id={_id} >{'Го избравте физичкиот блок со СИЗП број '
              + layer.feature.properties.OLD_ID + ' и површина ' + Math.round(layer.getMeasurement()) + ' m². '
              + 'Дали сте сигурни дека сакате да го избришете?'}</div>
            <Button onClick={() => { deleteLayer() }} size='' className='cancel' > Избриши</Button>
          </Modal.Body>
        </Modal>)}
  </ProcessButton>;
};

export const Delete = core.connect(state => ({
  processID: state.app.processID
}))(_Delete)
