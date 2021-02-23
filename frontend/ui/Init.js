import { redux } from 'perun-core';
import { ui } from '../Spatial';
import { ToolsBar, MiniBar, DataPanel, LayerPanel, StatusBar  } from '.';

export const gsaa = () => {
    const _token = redux.store.getState().security.svSession;

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

