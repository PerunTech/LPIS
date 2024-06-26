import { React, PropTypes, elements } from 'perun-core';
import { core, tools, ui } from '../../../Spatial';
import { config, editCPMsg } from './Config';
import { Form } from './Form';
import { Guidance } from './Guidance';
import { saveCP } from './Save';
import { ProcessButton } from '../..';
import { getFarmPPlanAssets, getLabel } from '../../Util';

const { Map, store, factory } = core;
const { edit } = tools;
const { Icon, DrawActions } = ui;
const { useReducer } = React;
const _id = 'editCP';

export const Edit = ({ processID }) => {
    const [{ layer, data, enumIdx, enumNames, isGuided, showForm }, setState] = useReducer((currState, update) =>
        ({ ...currState, ...update }),
        { layer: {}, data: {}, enumIdx: [], enumNames: [], isGuided: false, showForm: false });

    const enable = () => {
        // Parcels are already loaded, activate handlers on each. Do not call REST.
        const cropParcels = store.getState().farmRegistry?.farmPPlanData;

        if (cropParcels.length > 0) {
            cropParcels.forEach(cp => _setBlockEvents(cp, cropParcels))// _layerGroup.addLayer(cp),
            store.dispatch({ processID: _id })
            setState({ isGuided: true, showForm: false })
            // Map.fitBounds(cropParcels[0].getBounds());
        } else {
            disable();
            elements.alertUser(true, 'warning', getLabel('no_crop_parcels_found'), getLabel('add_crop_parcels_before_using_edit_tool'));
        }
    };

    const disable = () => {
        setState({ layer: {}, data: {}, enumIdx: [], enumNames: [], isGuided: false, showForm: false })
        // _layerGroup.clearLayers().removeFrom(Map);
        // store.dispatch({processID: '', minZoom: MAP_CONFIG.minZoom});
        getFarmPPlanAssets()
        store.dispatch({ processID: '' });
        edit.polygon.disable();
    }

    const _setBlockEvents = (cp, cropParcels) => {
        cp.on('mouseover', function () { this.setStyle({ color: '#00E334', fillColor: '#000000' }) })
            .on('mouseout', function () { this.setStyle(config.pathOptions) })
            .on('click', function () {
                initEdit(this);
                cropParcels.forEach(cp => cp.off('mouseover mouseout click'))
            }).bringToFront();
    }

    const initEdit = layer => {
        // Move map view on top of selected polygon.
        Map.fitBounds(layer.getBounds());
        // Activate edit handler on selected polygon
        edit.polygon.enable(layer, config);
        setState({ layer: layer, data: layer.feature.properties });
        const agriParcelId = layer.feature.properties?.AGRI_PARCEL_ID || 0
        const currentYear = new Date().getFullYear()
        const url = `/lpis/get/cropList/{init.token}/land_parcel/${agriParcelId}/year/${currentYear}/basic/false/otsc/false`
        core.http.call('get_code_list', {
            method: 'post', url,
            data: JSON.stringify({
                ...data,
                GEOM: factory.GeoJSON.fromLayer(layer)
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
            const title = err?.response?.data?.title || err
            const message = err?.response?.data?.message || ''
            elements.alertUser(true, 'error', title, message);
            disable();
        })

        // Activate edit event listeners on layer.
        layer.on('pm:edit', e => setState({ layer: e.target }));
    }

    const onSubmit = ({ formData }) => {
        saveCP(JSON.stringify({
            ...data,
            ...formData,
            OBJECT_ID: Number(layer.feature.id),
            object_id: Number(layer.feature.id),
            OBJECT_TYPE: Number(formData.type),
            PARENT_ID: Number(formData.parent_id),
            PKID: Number(formData.pkid),
            GEOM: factory.GeoJSON.fromLayer(layer),
            multypolygeometry: factory.GeoJSON.fromLayer(layer)
        }), disable);
    }

    const renderGuideForm = () => {
        return <Guidance id={_id} disable={disable} msg={editCPMsg} title={getLabel('edit_crop_parcel')} />
    }

    const renderForm = () => {
        return (
            <Form onSubmit={onSubmit} onChange={onChange} formData={data} enumIdx={enumIdx} enumNames={enumNames} >
                <DrawActions cancel={disable} />
            </Form>
        )
    }

    const onChange = ({ formData }) =>
        setState({ data: { ...data, ...formData } });

    const renderComponent = () => {
        let componentToRender = null

        if (isGuided && !showForm) {
            componentToRender = renderGuideForm()
        } else if (showForm && !isGuided) {
            componentToRender = renderForm()
        }

        return componentToRender
    }

    return <ProcessButton id={_id} onClick={enable}>
        <Icon name={_id} size='32px' />
        <span style={{ display: 'block', marginTop: '2px' }}>{getLabel('edit_crop_parcel')}</span>
        {processID === _id && renderComponent()}
    </ProcessButton>;
};

Edit.propTypes = {
    processID: PropTypes.string,
}
