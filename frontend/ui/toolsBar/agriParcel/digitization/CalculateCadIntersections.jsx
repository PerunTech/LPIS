import { React, Loading, elements } from 'perun-core'
import { core, ui } from '../../../../Spatial';
import { calculateCadIntersectionsMsg } from '../Config';
import { Guidance } from '../Guidance';
import { ProcessButton } from '../../ProcessButton';
import { getCadIntersections } from './CadIntersections';
import { bufferToString, getFarmMapAssets, isJSON } from '../../../Util';

const { Map, store, http } = core;
const { Icon } = ui;
const { alertUser } = elements;
const { useReducer } = React;
const _id = 'calculateCadIntersections';
const _iconId = 'area';

const _CalculateCadIntersections = ({ processID, agriParcels }) => {
  const [{ layer, loading, isGuided }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { layer: {}, loading: false, isGuided: false });

  const disable = () => {
    if (loading) {
      alertUser(true, 'info', 'Процесот е во тек')
    } else {
      Map.off('click');
      // Reset state, internal and application-wide.
      setState({ layer: {}, loading: false, isGuided: false });
      store.dispatch({ processID: '' });
      // Remove the working layer & get/refresh the assets
      layer.removeFrom && layer.removeFrom(Map);
      getFarmMapAssets();
      getCadIntersections();
    }
  }

  const initCalculation = layer => {
    setState({ loading: true, layer })
    const parcelId = layer.feature.id
    http.call('calculate-cad-intersections', {
      url: `/lpis/intersect/{init.token}/AGRI_PARCEL/${parcelId}`,
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
        disable()
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

  const _setBlockEvents = (layer, agriParcels) => {
    layer.on('mouseover', function () { this.setStyle({ color: '#eed000', fillColor: '#000000' }) })
      .on('mouseout', function () { this.setStyle({ color: '#3399ff', fillColor: '#3388ff' }) })
      .on('click', function () {
        initCalculation(this);
        agriParcels.forEach(ap => ap.off('mouseover mouseout click'))
      }).bringToFront();
  }

  const enable = () => {
    if (agriParcels.length > 0) {
      agriParcels.forEach(ap => _setBlockEvents(ap, agriParcels))
      store.dispatch({ processID: _id });
      setState({ isGuided: true })
    } else {
      alertUser(true,
        'warning',
        'Не се пронајдени земјоделски парцели.',
        'Додадете земјоделски парцели пред да ја користите алатката за пресметување пресеци.',
        () => disable());
    }
  }

  const renderGuideForm = () => {
    return <Guidance id={_id} disable={disable} msg={calculateCadIntersectionsMsg} title='Пресметај пресеци' />
  }

  const renderComponent = () => {
    let componentToRender = null

    if (isGuided) {
      componentToRender = renderGuideForm()
    }

    return componentToRender
  }

  return <ProcessButton id={_id} onClick={enable} >
    <Icon name={_iconId} size='30px' />
    <span style={{ display: 'block', marginTop: '5px' }}>Пресметај пресеци</span>
    {processID === _id && renderComponent()}
    {loading && <Loading />}
  </ProcessButton>;
}

export const CalculateCadIntersections = core.connect(state => ({
  processID: state.app.processID, agriParcels: state.farmRegistry?.agriParcels
}))(_CalculateCadIntersections)
