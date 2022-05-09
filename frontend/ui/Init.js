import { redux } from 'perun-core';
import { ui, core } from '../Spatial';
import { layerList } from '../config/layerList';
import { ToolsBar, MiniBar, DataPanel, LayerPanel, StatusBar, readCookie, loadFarmerAssets } from '.';
import { getFarmMapAssets } from './Util';

const { store } = core;

let _isLoaded = false;
const _gsaa = (_token) => {
    // Prevent multiple initializations.
    return !_isLoaded
        ? (_isLoaded = true, ui.init(_token)
            .addControl(MiniBar, {}, { position: 'topleft' })
            .addControl(DataPanel, {
                categories: [
                    { id: 'agri_parcel', label: 'Земјоделски парцели', isOpen: true },
                    { id: 'land_use_plan', label: 'Производни парцели', isOpen: true }
                ]
            }, { position: 'left' })
            .addControl(LayerPanel, {}, { position: 'right' })
            .addControl(StatusBar, {}, { position: 'bottom', className: 'status-bar' })
            .withNavigationControl()
            .withWindRose()
            .render('gsaa-map'))
        : null
}

export const gsaa = () => {
    const _token = readCookie('token');
    const _farmerId = Number(readCookie('farmerObj'));
    // const _token = redux.store.getState().security.svSession;
    // const _farmerId = 457156934 // 34956 242466 457156934

    // add check for token, farmerId existance and validate.
    // exit properly for the user on fail.

    core.store.addState('gsaa', { farmerId: _farmerId, token: _token });
    loadFarmerAssets(_token, _farmerId, true);

    return _gsaa(_token);
}

export const lpis = () => {
    const _token = redux.store.getState().security.svSession;

    return ui.init(_token)
        .addControl(ToolsBar, {}, { position: 'top' })
        .addControl(DataPanel, {}, { position: 'left' })
        .addControl(LayerPanel, {}, { position: 'right' })
        .addControl(StatusBar, {}, { position: 'bottom', className: 'status-bar' })
        .withNavigationControl()
        .addRasterLayers(layerList[0], layerList[1], { collapsed: false, position: 'right' })
        .withWindRose()
        .render('lpis-map');
}

export const farmRegLpis = () => {
    store.addState('farmRegistry', {
        'agriParcels': {}, 'farmPPlanData': {}, 'farmObjId': '', 'farmObjTypeId': '', 'actionType': '',
        'fic': '', 'fullName': '', 'tableName': '', 'selectedParcelId': '', 'selectedCropParcelId': '', 'saveIsPending': false
    })
    const _token = redux.store.getState().security.svSession;
    getFarmMapAssets(true)

    return ui.init(_token)
        .addControl(ToolsBar, {}, { position: 'top' })
        .addControl(DataPanel, {}, { position: 'left' })
        .addControl(LayerPanel, {}, { position: 'right' })
        .addControl(StatusBar, {}, { position: 'bottom', className: 'status-bar' })
        .withNavigationControl()
        .addRasterLayers(layerList[0], layerList[1], { collapsed: false, position: 'right' })
        .withWindRose()
        .render('farm-registry-map');
}
