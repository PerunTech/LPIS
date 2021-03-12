import { redux } from 'perun-core';
import { ui, core } from '../Spatial';
import { ToolsBar, MiniBar, DataPanel, LayerPanel, StatusBar, readCookie, loadFarmerAssets  } from '.';

export const gsaa = () => {
    // const _token = redux.store.getState().security.svSession;
    const _token = readCookie('token');
    const _farmerId = readCookie('farmerObj');

    // add check for token, farmerId existance and validate.
    // exit properly for the user on fail.

    core.store.addState('gsaa', { farmerId: _farmerId });
    loadFarmerAssets(_token, _farmerId);

    return ui.init(_token)
        .addControl(MiniBar, {}, { position: 'top' })
        .addControl(DataPanel, {categories: [
            { id: 'agri_parcel', label: 'Земјоделски парцели', isOpen: false },
            { id: 'land_use_plan', label: 'Производни парцели', isOpen: true }
        ]}, { position: 'left' })
        .addControl(LayerPanel, {}, { position: 'right' })
        .addControl(StatusBar, {}, { position: 'bottom', className: 'status-bar' })
        .withNavigationControl()
        .withWindRose()
        .render();
}

export const lpis = () => {
    const _token = redux.store.getState().security.svSession;

    return ui.init(_token)
        .addControl(ToolsBar, {}, { position: 'top' })
        .addControl(DataPanel, {}, { position: 'left' })
        .addControl(LayerPanel, {}, { position: 'right' })
        .addControl(StatusBar, {}, { position: 'bottom', className: 'status-bar' })
        .withNavigationControl()
        .withWindRose()
        .render();
}