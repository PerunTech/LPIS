import { React, PropTypes, elements } from 'perun-core';
import { core, data, ui, config as cfg } from '../../../Spatial';
import { config, createCPMsg } from './Config';
import { Form } from './Form';
import { Guidance } from './Guidance';
import { saveCP } from './Save';
import { ProcessButton } from '../..';
import { bufferToString, getFarmPPlanAssets, getLabel, isJSON, strcmp } from '../../Util';
import { cleanupWorkingCropParcelLayers } from './Util';

const { alertUser } = elements;
const { MIN_DIGI_SCALE, MAP_CONFIG } = cfg;
const { Map, store, factory, http, util } = core;
const { geobuf, protobuf } = data;
const { Icon, DrawActions } = ui;
const { useReducer } = React;
const _id = 'createCP';

/**
 * Create a crop parcel by selecting a single point.
 */
const _Create = ({ processID, farmObjId }) => {
    const [{ layer, data, X, Y, enumIdx, enumNames, isGuided, showForm }, setState] = useReducer((currState, update) =>
        ({ ...currState, ...update }),
        { layer: {}, data: {}, X: 0, Y: 0, enumIdx: [], enumNames: [], isGuided: false, showForm: false });

    const getCropList = (layer, url) => {
        http.call('get_code_list', {
            method: 'post', url,
            data: JSON.stringify({
                ...data,
                GEOM: factory.GeoJSON.fromLayer(layer)
            }),
        }).then(response => {
            if (strcmp(response.data?.type, 'error')) {
                const title = response.data.title || getLabel('something_went_wrong')
                const msg = response.data.message || ''
                alertUser(true, 'error', title, msg, disable)
            } else {
                setState({ isGuided: false, showForm: true, enumIdx: response.data.enum || [], enumNames: response.data.enumNames || [] })
            }
        }).catch(err => {
            console.log(err);
            const title = err.response?.data?.title || err
            const msg = err.response?.data?.message || ''
            alertUser(true, 'error', title, msg)
            disable();
        })
    }

    const enable = () => {
        store.dispatch({ processID: _id, minZoom: MIN_DIGI_SCALE });
        setState({ isGuided: true })

        // Click handler for selection of location and creation of crop parcel geometry.
        Map.on('click', e => {
            const p = Map.transform(e.latlng);
            setState({ X: p.x, Y: p.y });
            const url = `/spatial/geometry/layer/cutoff/{init.token}/AGRI_PARCEL/LAND_USE_PLAN/${p.x}/${p.y}/${farmObjId}`
            http.call('create_ap', { url, responseType: 'arraybuffer' }).then(response => {
                const data = geobuf.decode(protobuf(response));
                const geojson = factory.geoJSON(data, config.pathOptions);
                const layers = geojson.getLayers()
                if (layers.length > 0) {
                    geojson.getLayers().forEach(layer => {
                        // Flatten the geometry array, so utilities can read the thing. god knows why this happens.
                        layer.setLatLngs([...util.flattenDeep(layer.getLatLngs())])
                        layer.addTo(Map);
                        const landCoverCode = layer.feature.properties.LAND_COVER_CODE
                        const formData = layer.feature.properties
                        formData.AREA = Math.round(Number(layer.feature.properties.AREA))
                        formData.DESCRIPTOR = 'WORKING_CROP_PARCEL_LAYER'
                        const currentYear = new Date().getFullYear()
                        const codeListUrl = `/lpis/get/cropList/{init.token}/land_cover/${landCoverCode}/year/${currentYear}/basic/false/otsc/false`
                        layer.feature.id = 0
                        getCropList(layer, codeListUrl)
                        setState({ data: formData, layer: layer })
                    })
                } else {
                    alertUser(true, 'info', getLabel('no_data_found'))
                    disable()
                }
            }).catch(err => {
                const { response } = err
                let msg = ''
                const stringifiedResponse = bufferToString(response?.data)
                if (isJSON(stringifiedResponse) && Object.keys(JSON.parse(stringifiedResponse)).length > 1) {
                    const parsedResponse = JSON.parse(stringifiedResponse)
                    msg = parsedResponse?.Label_Code || ''
                }
                alertUser(true, 'error', getLabel('something_went_wrong'), msg)
                disable()
            });

            Map.off('click');
        });
    };

    const disable = () => {
        Map.off('click');
        // Reset state, internal and application-wide.
        setState({ layer: {}, data: {}, X: 0, Y: 0, enumIdx: [], enumNames: [], isGuided: false, showForm: false });
        store.dispatch({ processID: '', minZoom: MAP_CONFIG.minZoom });
        // Clean-up the working geometry
        cleanupWorkingCropParcelLayers()
        // add refresh assets
        getFarmPPlanAssets();
    }

    const onChange = ({ formData }) =>
        setState({ data: { ...data, ...formData } });

    const onSubmit = ({ formData }) =>
        saveCP(JSON.stringify({
            ...data,
            ...formData,
            GEOM: factory.GeoJSON.fromLayer(layer),
            multypolyarray: factory.GeoJSON.fromLayer(layer),
            X: X,
            Y: Y
        }), disable);

    const renderGuideForm = () => {
        return <Guidance id={_id} disable={disable} msg={createCPMsg} title={getLabel('create_crop_parcel')} />
    }

    const renderForm = () => {
        return (
            <Form onSubmit={onSubmit} onChange={onChange} formData={data} enumIdx={enumIdx} enumNames={enumNames} >
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
        <ProcessButton id={_id} onClick={enable} >
            <Icon name={_id} size='30px' />
            <span style={{ display: 'block', marginTop: '2px' }}>{getLabel('create_crop_parcel')}</span>
            {processID === _id && renderComponent()}
        </ProcessButton>
    );
};

_Create.propTypes = {
    processID: PropTypes.string,
    farmObjId: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
    ])
}

export const Create = core.connect(state => ({
    farmObjId: state.farmRegistry?.farmObjId
}))(_Create)
