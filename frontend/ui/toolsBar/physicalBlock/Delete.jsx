import { React, elements } from 'perun-core';
import { core, ui } from '../../../Spatial';
import { Guidance } from '../agriParcel/Guidance';
import { ProcessButton } from '../ProcessButton';
import { getLabel, getMeasurementUnit, strcmp } from '../../Util'

const { Map, store, http } = core;
const { Button, Icon, DrawActions, Modal } = ui;
const { alertUser } = elements;
const { useReducer } = React;

const _id = 'deletePB';

const _Delete = ({ processID, loadedPhysicalBlocks }) => {
  const [{ isGuided, layer }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }), { isGuided: false, layer: {} });

  const setBlockEvents = layers => {
    Object.values(layers).forEach(layer => {
      layer.on('click', function () {
        setState({ layer: this, isGuided: false })
      })
    })
  }

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
      alertUser(true, 'success', getLabel('delete_physical_block_success'));
      const newLoadedPhysicalBlocks = Object.values(loadedPhysicalBlocks).filter(loadedLayer => !strcmp(layer.feature.id, loadedLayer.feature.id))
      if (Array.isArray(newLoadedPhysicalBlocks) && newLoadedPhysicalBlocks.length > 0) {
        store.dispatch({ loadedPhysicalBlocks: newLoadedPhysicalBlocks })
      } else {
        store.dispatch({ physicalBlocksHaveBeenLoaded: false, loadedPhysicalBlocks: [] })
      }
      disable()
    }).catch(() => {
      alertUser(true, 'error', getLabel('delete_physical_block_error'));
      disable()
    })
  }

  const enable = () => {
    if (!Object.keys(loadedPhysicalBlocks).length > 0) {
      alertUser(true, 'info', getLabel('no_loaded_physical_blocks'), getLabel('load_physical_blocks_before_using_delete_tool'))
    } else {
      store.dispatch({ processID: _id });
      setState({ isGuided: true })
      setBlockEvents(loadedPhysicalBlocks)
    }
  }

  const disable = () => {
    // Reset state, internal and application-wide.
    store.dispatch({ processID: '' });
    setState({ isGuided: false, layer: {} });
    Object.values(loadedPhysicalBlocks).forEach(layer => layer.off('click'))
  }

  return <ProcessButton id={_id} onClick={() => enable()} title={getLabel('delete_physical_block')}>
    <Icon name={_id} size='30px' />
    <span style={{ display: 'block', marginTop: '5px' }}>{getLabel('delete_physical_block')}</span>
    {processID === _id
      && (isGuided
        ? <Guidance id={_id} disable={disable} msg={[`${getLabel('delete_physical_block_msg')}`, '']} title={getLabel('delete_physical_block')} />
        : <Modal id='measure-dialog'
          className='delete-control-dialog'
          show
          backdrop={false}
          enforceFocus={false}
          container={document.getElementsByClassName('control-map')[0]} >
          <Modal.Title>
            <Button disabled className='as-label ap-modal-title' >{getLabel('delete_physical_block')}</Button>
            <DrawActions cancel={disable} />
          </Modal.Title>
          <Modal.Body className='ap-modal-body' >
            <div id={_id} >{`${getLabel('delete_physical_block_msg_one')} `
              + layer.feature.properties.OLD_ID + ` ${getLabel('delete_physical_block_msg_two')} ` + Math.round(layer.getMeasurement()) + ` ${getMeasurementUnit(true)}. `
              + `${getLabel('delete_physical_block_confirmation')}`}</div>
            <Button onClick={() => { deleteLayer() }} size='' className='cancel' > {getLabel('delete')}</Button>
          </Modal.Body>
        </Modal>)}
  </ProcessButton>;
};

export const Delete = core.connect(state => ({
  processID: state.app.processID,
  loadedPhysicalBlocks: state.lpis?.loadedPhysicalBlocks,
}))(_Delete)
