import { redux } from 'perun-core';
import { ui } from '../Spatial';
import { ToolsBar, DataPanel, LayerPanel, StatusBar  } from '.';

export const Init = () => {
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