import { React, Loading, elements } from 'perun-core';
import { core, ui, data, tools, config } from '../../../../Spatial';
import { config as apConfig } from '../Config';
import { bufferToString, getFarmMapAssets, strcmp } from '../../../Util';
import { saveAP } from '../SaveAP';
import { Guidance } from '../Guidance';
import { Form } from '../Form';
import { ProcessButton } from '../../ProcessButton';

const { MIN_DIGI_SCALE, MAP_CONFIG } = config;
const { Map, factory, store, http } = core;
const { geobuf, protobuf } = data;
const { edit } = tools;
const { Icon, DrawActions, Button } = ui;
const { alertUser } = elements;
const { useReducer } = React;

const _id = 'copyRefParcel';
const _iconId = 'copy-secondary';
const _layerGroup = factory.layerGroup();

const _CopyRefParcel = ({ processID, farmObjId, agriParcels }) => {
  const [{ layer, data, loading, isGuided, showForm, showGuidanceButton }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { layer: {}, data: {}, loading: false, isGuided: false, showForm: false, showGuidanceButton: false });

  const _editAP = () => {
    const currZoom = Map.getZoom();
    // This line ensures no racing codition on the current bounding box.
    // We set view manually before calling Map.getBBox in _fetchBlocks and bbox will NOT contain a whole country.
    Map.setView(Map.getCenter(), currZoom < MIN_DIGI_SCALE ? MIN_DIGI_SCALE : currZoom); // zoom is inverse to scale
    _layerGroup.addTo(Map);
  }

  const _stopEditAP = () => {
    _layerGroup.clearLayers().removeFrom(Map);
    edit.polygon.disable();
  }

  const initEdit = layer => {
    // Move map view on top of selected polygon.
    Map.fitBounds(layer.getBounds());
    // Activate edit handler on selected polygon
    edit.polygon.enable(layer, apConfig);
    // Activate edit event listeners on layer.
    layer.on('pm:edit', e => setState({ layer: e.target }));
  }

  const getReferentParcel = layer => {
    // Get the referent parcel layer for the selected agri parcel
    setState({ loading: true })
    const parcelOldId = layer.feature.properties.OLD_ID
    const url = `/lpis/copy/parcel/{init.token}/RP/${parcelOldId}`
    http.call('get-referent-parcel', { url, responseType: 'arraybuffer' }).then(response => {
      setState({ loading: false, showGuidanceButton: true })
      const data = geobuf.decode(protobuf(response));
      const geojson = factory.geoJSON(data, apConfig.pathOptions);
      const layers = geojson.getLayers();

      layers.forEach(layer => {
        // assign metadata
        layer.feature.id = 0
        layer.feature.properties.parent_id = farmObjId
        layer.addTo(Map);
        _editAP()
        initEdit(layer)
        setState({ data: layer.feature.properties, layer })
      })
    }).catch(err => {
      console.error(err)
      setState({ loading: false })
      const stringfiedResponse = bufferToString(err.response.data)
      if (strcmp(typeof stringfiedResponse, 'string')) {
        if (stringfiedResponse.includes('err.no_reference_parcel.selected')) {
          const translatedError = 'Не е избрана референтна парцела'
          alertUser(true, 'info', translatedError)
        } else {
          alertUser(true, 'error', 'Настана грешка')
        }
      } else {
        alertUser(true, 'error', 'Настана грешка')
      }
      disable()
    })
  }

  const _setBlockEvents = (layer, agriParcels) => {
    layer.on('mouseover', function () { this.setStyle({ color: '#eed000', fillColor: '#000000' }) })
      .on('mouseout', function () { this.setStyle({ color: '#3399ff', fillColor: '#3388ff' }) })
      .on('click', function () {
        this.setStyle({ color: '#3399ff', fillColor: '#3388ff' })
        getReferentParcel(this);
        agriParcels.forEach(ap => ap.off('mouseover mouseout click'))
      }).bringToFront();
  }

  const disable = () => {
    // Remove the Map click event listener
    Map.off('click');
    _stopEditAP()
    // Reset state, internal and application-wide.
    setState({ loading: false, isGuided: false, showForm: false, showGuidanceButton: false, layer: {}, data: {} });
    store.dispatch({ processID: '', minZoom: MAP_CONFIG.minZoom });
    getFarmMapAssets()
  };

  const enable = () => {
    if (agriParcels.length > 0) {
      agriParcels.forEach(sc => _setBlockEvents(sc, agriParcels))
      store.dispatch({ processID: _id });
      setState({ isGuided: true, loading: false, layer: {}, data: {} })
    } else {
      alertUser(
        true,
        'warning',
        'Не се пронајдени земјоделски парцели.',
        'Додадете земјоделски парцели пред да ја користите алатката за менување.'
      );
      disable()
    }
  }

  const onChange = ({ formData }) => {
    setState({ data: { ...data, ...formData } });
  }

  const onSubmit = formData => {
    saveAP(JSON.stringify({
      ...data,
      ...formData,
      GEOM: factory.GeoJSON.fromLayer(layer),
      X: X,
      Y: Y,
      parent_id: farmObjId,
      OBJECT_ID: 0
    }), disable);
  }

  const handleShowForm = () => {
    setState({ isGuided: false, showForm: true })
  }

  const renderGuideForm = () => {
    return (
      <Guidance id={_id} disable={disable} msg={['', '']} title='Копирај референтна парцела'>
        {showGuidanceButton && <div className='mt-2'>
          <Button className='next' size='' onClick={handleShowForm}>
            Прикажи форма
          </Button>
        </div>}
      </Guidance>
    )
  }

  const renderForm = () => {
    return (
      <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
        <DrawActions cancel={disable} />
      </Form>
    )
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

  return (
    <ProcessButton id={_id} onClick={enable} title='Копирај референтна парцела'>
      <Icon name={_iconId} size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>Коп. реф. парц.</span>
      {processID === _id && renderComponent()}
      {loading && <Loading />}
    </ProcessButton>
  )
}

export const CopyRefParcel = core.connect(state => ({
  processID: state.app.processID, farmObjId: state.farmRegistry?.farmObjId, agriParcels: state.farmRegistry?.agriParcels
}))(_CopyRefParcel)
