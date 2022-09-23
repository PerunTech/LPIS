import { React, Loading, elements } from 'perun-core';
import { core, ui, data, tools } from '../../../../Spatial';
import { config, cutAPMsg } from '../Config';
import { decodeResponse, getFarmMapAssets } from '../../../Util';
import { saveAP } from '../SaveAP';
import { Guidance } from '../Guidance';
import { Form } from '../Form';
import { ProcessButton } from '../../ProcessButton';

const { Map, store, factory, http } = core;
const { geobuf, protobuf } = data;
const { draw: { polygon } } = tools;
const { Icon, DrawActions } = ui;
const { alertUser } = elements;
const { useReducer, useEffect } = React;
const _id = 'cutAP';

const _Cut = ({ processID, farmObjId, saveIsPending }) => {
  const [{ layer, data, isGuided, showForm }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }), { layer: {}, data: {}, isGuided: false, showForm: false });

  useEffect(() => {
    return () => {
      polygon.disable('force');
      Map.off('new_shape');
    }
  }, [])

  const enable = () => {
    Map.on('new_shape', e => cutParcel(e));
    // state setters
    store.dispatch({ processID: _id });
    setState({ isGuided: true, showForm: false })
    // init draw handler
    polygon.enable(config);
  }

  const disable = () => {
    // Reset state, internal and application-wide.
    Map.off('new_shape');
    setState({ layer: {}, data: {}, isGuided: false, showForm: false });
    store.dispatch({ processID: '' });
    // We remove the working geometry, save process will add the result, as well as additional vectors.
    layer.removeFrom && layer.removeFrom(Map);
    polygon.disable('force');
    // refresh work layer
    getFarmMapAssets();
  }

  const cutParcel = e => {
    if (e && e.layer) {
      http.call(_id, {
        url: '/spatial/geometry/hole/{init.token}/AGRI_PARCEL/' + farmObjId,
        method: 'post',
        responseType: 'arraybuffer',
        data: JSON.stringify(factory.GeoJSON.fromLayer(e.layer))
      }).then(response => {
        const buff = geobuf.decode(protobuf(response));
        const geojson = factory.geoJSON(buff, config.pathOptions);
        geojson.getLayers().forEach(layer => {
          layer.addTo(Map);
          e.layer.removeFrom(Map);
          setState({
            layer: layer,
            data: {
              ...layer.feature.properties,
              OBJECT_ID: Number(layer.feature.id),
              FORCE_CROP_REFRESH: true
            },
            isGuided: false,
            showForm: true
          })
        })
      }).catch(error => {
        const { response } = error
        const errorMsg = decodeResponse(response)
        alertUser(true, 'error', 'Грешка при отсекување земјоделска парцела', errorMsg);
        e.layer.removeFrom(Map);
        disable()
      })
    }

    Map.off('new_shape');
  }

  const onSubmit = ({ formData }) => {
    saveAP(JSON.stringify({
      ...data,
      ...formData,
      GEOM: factory.GeoJSON.fromLayer(layer)
    }), disable);
  }

  const onChange = ({ formData }) => {
    setState({ data: { ...data, ...formData } });
  }

  const renderGuideForm = () => {
    return <Guidance id={_id}
      finish={() => polygon._finishShape()}
      undo={() => polygon._removeLastVertex()}
      disable={() => disable()}
      msg={cutAPMsg}
      title='Отсечи земјоделска парцела'
    />
  }

  const renderForm = () => {
    return <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
      <DrawActions cancel={() => disable()} />
    </Form>
  }

  const renderComponent = () => {
    let componentToRender = null

    if (isGuided && !showForm) {
      componentToRender = renderGuideForm()
    } else if (showForm && !isGuided) {
      componentToRender = renderForm()
    }

    return componentToRender
  }

  return <ProcessButton id={_id} onClick={enable} title='Отсечи парцела' className='mr-2' >
    <Icon name={_id} size='30px' />
    <span style={{ display: 'block', marginTop: '5px' }}>Отсечи</span>
    {processID === _id && renderComponent()}
    {saveIsPending && <Loading />}
  </ProcessButton>
}

export const Cut = core.connect(state => ({
  processID: state.app.processID, saveIsPending: state.farmRegistry?.saveIsPending, farmObjId: state.farmRegistry?.farmObjId
}))(_Cut)
