import { React, PropTypes, elements } from 'perun-core';
import { core, data, tools, ui } from '../../../Spatial';
import { config, drawCPMsg } from './Config';
import { Form } from './Form';
import { Guidance } from './Guidance';
import { saveCP } from './Save';
import { ProcessButton, loadFarmerAssets } from '../..';
import { getFarmPPlanAssets, strcmp } from '../../Util';

const { Map, store, factory, http } = core;
const { geobuf, protobuf } = data;
const { draw: { polygon } } = tools;
const { Icon, DrawActions } = ui;
const { useReducer } = React;
const _id = 'drawCP';

/**
 * Draw crop parcel.
 */
const _Draw = ({ processID, mapId, farmerId }) => {
    const [{ layer, data, enumIdx, enumNames, isGuided, showForm }, setState] = useReducer((currState, update) =>
        ({ ...currState, ...update }), { layer: {}, data: {}, enumIdx: [], enumNames: [], isGuided: false, showForm: false });

    const getParcelData = layer => {
        const url = `/spatial/geometry/get/wkt/{init.token}/AGRI_PARCEL/null`
        http.call('get_wkt', { method: 'post', url, data: JSON.stringify({ GEOM: layer }), responseType: 'arraybuffer' }).then(response => {
            const proto = protobuf(response)
            const buff = geobuf.decode(proto)
            if (buff.features && Array.isArray(buff.features) && buff.features.length > 0) {
                const landCoverCode = buff.features[0]?.properties?.LAND_COVER_CODE || '0'
                const currentYear = new Date().getFullYear()
                const codeListUrl = `/lpis/get/cropList/{init.token}/land_cover/${landCoverCode}/year/${currentYear}/basic/false/otsc/false`
                http.call('get_code_list', {
                    method: 'post', url: codeListUrl,
                    data: JSON.stringify({
                        ...data,
                        GEOM: layer
                    }),
                }).then(response => {
                    if (response.data.type && strcmp(response.data.type, 'error')) {
                        elements.alertUser(true, 'error', response.data.title, response.data.message || '')
                        disable()
                    } else {
                        setState({ isGuided: false, showForm: true, enumIdx: response.data.enum || [], enumNames: response.data.enumNames || [] })
                    }
                }).catch(err => {
                    console.log(err);
                    disable();
                })
            } else {
                elements.alertUser(true, 'error', 'Настана грешка', '', disable)
            }
        }).catch(err => {
            console.log(err);
            disable();
        })
    }

    const enable = () => {
        Map.on('new_shape', e => {
            if (e && e.layer) {
                setState({ layer: e.layer })
                e.layer.addTo(Map)
                const url = '/lpis/get/cropList/{gsaa.token}/{gsaa.farmerId}'
                if (mapId === 'farm-registry-map') {
                    const area = Math.round(e.layer.getMeasurement())
                    const formData = { AREA: area }
                    setState({ data: { ...data, ...formData } })
                    getParcelData(factory.GeoJSON.fromLayer(e.layer))
                } else {
                    http.call('get_code_list', {
                        method: 'post', url,
                        data: JSON.stringify({
                            ...data,
                            GEOM: factory.GeoJSON.fromLayer(e.layer)
                        }),
                    }).then(response => {
                        if (response.data.type && strcmp(response.data.type, 'error')) {
                            elements.alertUser(true, 'error', response.data.title, response.data.message || '')
                            disable()
                        } else {
                            setState({ isGuided: false, showForm: true, enumIdx: response.data.enum || [], enumNames: response.data.enumNames || [] })
                        }
                    }).catch(err => {
                        console.log(err);
                        disable();
                    })
                }
            }
            Map.off('new_shape');
        });

        setState({ isGuided: true })
        store.dispatch({ processID: _id });
        polygon.enable(config);
    };

    const disable = () => {
        // Reset state, internal and application-wide.
        setState({ layer: {}, data: {}, enumIdx: [], enumNames: [], isGuided: false, showForm: false });
        store.dispatch({ processID: '' });

        // We remove the working geometry, save process will add the result.
        layer.removeFrom && layer.removeFrom(Map);
        // Disable draw handler.
        polygon.disable('force');
        // add refresh assets
        if (mapId === 'farm-registry-map') {
            getFarmPPlanAssets();
        } else {
            loadFarmerAssets();
        }
    }

    const onChange = ({ formData }) =>
        setState({ data: { ...data, ...formData } });

    const onSubmit = ({ formData }) => {
        saveCP(JSON.stringify({
            ...data,
            ...formData,
            parent_id: farmerId,
            GEOM: factory.GeoJSON.fromLayer(layer)
        }), disable);
    }

    const renderGuideForm = () => {
        return <Guidance id={_id}
            finish={() => polygon._finishShape()}
            undo={() => polygon._removeLastVertex()}
            disable={disable}
            msg={drawCPMsg}
            title='Нацртај производна парцела' />
    }

    const renderForm = () => {
        return <Form onSubmit={onSubmit} onChange={onChange} formData={data} enumIdx={enumIdx} enumNames={enumNames} >
            <DrawActions
                cancel={disable} />
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

    return <ProcessButton id={_id} onClick={enable} >
        <Icon name={_id} size='32px' />
        <span style={{ display: 'block', marginTop: '2px' }}>Нацртај производна парцела</span>
        {processID === _id && renderComponent()}
    </ProcessButton>;
};

_Draw.propTypes = {
    processID: PropTypes.string,
    mapId: PropTypes.string,
    farmerId: PropTypes.number,
    farmObjId: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
    ])
}

export const Draw = core.connect(state => ({
    mapId: state.map.id, farmObjId: state.farmRegistry?.farmObjId
}))(_Draw)
