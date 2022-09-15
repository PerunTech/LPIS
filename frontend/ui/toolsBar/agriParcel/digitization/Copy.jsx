import { React, Loading, elements } from 'perun-core';
import { core, ui, data, tools, config as cfg } from '../../../../Spatial';
import { config, copyAPMsg } from '../Config';
import { getFarmMapAssets, strcmp } from '../../../Util';
import { saveAP } from '../SaveAP';
import { Guidance } from '../Guidance';
import { Form } from '../Form';
import { ProcessButton } from '../../ProcessButton';

const { MIN_DIGI_SCALE, MAP_CONFIG } = cfg;
const { Map, store, factory, http } = core;
const { geobuf, protobuf } = data;
const { Icon, Button, DrawActions } = ui;
const { edit } = tools;
const { alertUser } = elements;
const { useReducer } = React;

const _id = 'copy';
const _layerGroup = factory.layerGroup();

const _Copy = ({ processID, farmObjId, saveIsPending }) => {
    const [{ layer, initialLandCoverCode, data, X, Y, loading, showForm, isGuided, showGuidanceButton }, setState] = useReducer((currState, update) =>
        ({ ...currState, ...update }),
        { layer: {}, initialLandCoverCode: '', data: {}, X: 0, Y: 0, loading: false, isGuided: false, showGuidanceButton: false, showForm: false });

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
        layer.setStyle({ color: '#005cb8', fillColor: '#000000' })
        // Activate edit handler on selected polygon
        edit.polygon.enable(layer, config);
        // Activate edit event listeners on layer.
        layer.on('pm:edit', e => setState({ layer: e.target }));
    }

    const disable = () => {
        Map.off('click');
        // Reset state, internal and application-wide.
        setState({ layer: {}, initialLandCoverCode: '', data: {}, X: 0, Y: 0, loading: false, isGuided: false, showGuidanceButton: false, showForm: false });
        store.dispatch({ processID: '', minZoom: MAP_CONFIG.minZoom });
        // We remove the working geometry, save process will add the result.
        layer.removeFrom && layer.removeFrom(Map);
        _stopEditAP()
        getFarmMapAssets();
    }

    const enable = () => {
        setState({ isGuided: true })
        store.dispatch({ processID: _id });

        // Click handler for selection of location and creation of crop parcel geometry.
        Map.on('click', e => {
            const p = Map.transform(e.latlng);
            setState({ X: p.x, Y: p.y, loading: true });

            http.call('copy-agri', {
                url: '/lpis/copy/parcel/{init.token}/AGRI_PARCEL/' + p.x + '/' + p.y,
                method: 'post',
                responseType: 'arraybuffer',
            }).then(response => {
                setState({ loading: false, showGuidanceButton: true })
                const proto = protobuf(response);
                const buff = geobuf.decode(proto);
                const geojson = factory.geoJSON(buff, config.pathOptions);
                geojson.getLayers().forEach(layer => {
                    const landCoverCode = layer.feature.properties?.LAND_USE_ID
                    const data = { LAND_COVER_CODE: landCoverCode }
                    // assign metadata
                    layer.feature.id = 0
                    layer.feature.properties.parent_id = farmObjId
                    layer.feature.properties.LAND_COVER_CODE = landCoverCode
                    layer.addTo(Map);
                    _editAP()
                    initEdit(layer)
                    setState({ data, layer: layer, initialLandCoverCode: landCoverCode })
                })
            }).catch(err => {
                console.log(err)
                disable()
                alertUser(true, 'error', 'Настана грешка')
            });

            Map.off('click');
        });
    };

    const onChange = ({ formData }) => {
        setState({ data: { ...data, ...formData } });
    }

    const executeSaveAP = formData => {
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

    const onSubmit = ({ formData }) => {
        if (!strcmp(formData.LAND_COVER_CODE, initialLandCoverCode)) {
            const title = 'Избравте различна вредност за Употреба на земјиште'
            const msg = 'Дали сте сигурни дека сакате да продолжите?'
            alertUser(true, 'warning', title, msg, () => executeSaveAP(formData), () => { }, true, 'Продолжи', 'Откажи')
        } else {
            executeSaveAP(formData)
        }
    }

    const handleShowForm = () => {
        setState({ isGuided: false, showForm: true })
    }

    const renderGuideForm = () => {
        let msg = copyAPMsg
        if (showGuidanceButton) {
            msg = ['', '']
        }
        return (
            <Guidance id={_id} disable={disable} msg={msg} title='Копирај земјоделска парцела'>
                {showGuidanceButton && <div className='mt-2'>
                    <Button className='next' size='' onClick={handleShowForm}>
                        Прикажи форма
                    </Button>
                </div>}
            </Guidance>
        )
    }

    const renderForm = () => {
        return <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
            <DrawActions cancel={disable} />
        </Form>
    }

    const componentToRender = () => {
        let componentToRender = null

        if (isGuided && !showForm) {
            componentToRender = renderGuideForm()
        } else if (showForm && !isGuided) {
            componentToRender = renderForm()
        }

        return componentToRender
    }

    return (
        <ProcessButton id={_id} onClick={enable} title='Копирај парцела' className='mr-2' >
            <Icon name={_id} size='30px' />
            <span style={{ display: 'block', marginTop: '5px' }}>Копирај</span>
            {processID === _id && componentToRender()}
            {(loading || saveIsPending) && <Loading />}
        </ProcessButton>
    );
};

export const Copy = core.connect(state => ({
    processID: state.app.processID, saveIsPending: state.farmRegistry?.saveIsPending, farmObjId: state.farmRegistry?.farmObjId
}))(_Copy)
