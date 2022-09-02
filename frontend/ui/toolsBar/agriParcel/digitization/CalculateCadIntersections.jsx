import { React, Loading, elements } from 'perun-core'
import { core, ui } from '../../../../Spatial';
import { calculateCadIntersectionsMsg } from '../Config';
import { Guidance } from '../Guidance';
import { ProcessButton } from '../../ProcessButton';
import { getCadIntersections } from './CadIntersections';
import { getFarmMapAssets, bufferToString, isJSON } from '../../../Util';

const { store, http } = core;
const { Icon } = ui;
const { alertUser } = elements;
const { useReducer } = React;
const _id = 'calculateCadIntersections';
const _iconId = 'intersection';

const _CalculateCadIntersections = ({ processID, agriParcels, farmObjId }) => {
  const [{ loading, isGuided }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { loading: false, isGuided: false });

  const disable = (getIntersections = false) => {
    if (loading) {
      alertUser(true, 'info', 'Процесот е во тек')
    } else {
      // Reset state, internal and application-wide.
      setState({ layer: {}, loading: false, isGuided: false });
      store.dispatch({ processID: '' });
      if (getIntersections) {
        // Get/refresh the assets
        getFarmMapAssets();
        getCadIntersections();
      }
    }
  }

  const initCalculation = () => {
    setState({ loading: true })
    http.call('calculate-cad-intersections', {
      url: `/lpis/intersect/{init.token}/FARMER/${farmObjId}`,
      method: 'get',
      responseType: 'arraybuffer'
    }).then(response => {
      setState({ loading: false })
      const stringifiedResponse = bufferToString(response?.data)
      if (isJSON(stringifiedResponse) && Object.keys(JSON.parse(stringifiedResponse)).length > 1) {
        const parsedResponse = JSON.parse(stringifiedResponse)
        const type = parsedResponse?.type?.toLowerCase() || 'info'
        const title = parsedResponse?.title || ''
        const msg = parsedResponse?.message || ''
        alertUser(true, type, title, msg)
        disable(true)
      }
    }).catch(error => {
      setState({ loading: false })
      const { response } = error
      let title = 'Настана грешка'
      let msg = ''
      const stringifiedResponse = bufferToString(response?.data)
      if (isJSON(stringifiedResponse) && Object.keys(JSON.parse(stringifiedResponse)).length > 1) {
        const parsedResponse = JSON.parse(stringifiedResponse)
        title = parsedResponse?.title || title
        msg = parsedResponse?.message || ''
      }
      alertUser(true, 'error', title, msg)
      disable()
    })
  }

  const enable = () => {
    if (agriParcels.length > 0) {
      store.dispatch({ processID: _id });
      setState({ isGuided: true })
      initCalculation()
    } else {
      alertUser(true, 'warning', 'Не се пронајдени земјоделски парцели.', 'Додадете земјоделски парцели пред да ја користите алатката за пресметување пресеци.');
      disable()
    }
  }

  const renderGuideForm = () => {
    return <Guidance id={_id} disable={disable} msg={calculateCadIntersectionsMsg} title='Пресметување пресеци' />
  }

  const renderComponent = () => {
    let componentToRender = null

    if (isGuided) {
      componentToRender = renderGuideForm()
    }

    return componentToRender
  }

  return <ProcessButton id={_id} onClick={enable} title='Пресметај пресеци'>
    <Icon name={_iconId} size='30px' />
    <span style={{ display: 'block', marginTop: '5px' }}>Пресм. пресеци</span>
    {processID === _id && renderComponent()}
    {loading && <Loading />}
  </ProcessButton>;
}

export const CalculateCadIntersections = core.connect(state => ({
  processID: state.app.processID, agriParcels: state.farmRegistry?.agriParcels, farmObjId: state.farmRegistry?.farmObjId
}))(_CalculateCadIntersections)
