import { redux } from 'perun-core';
import { spatial } from '../core';
import { ToolsBar, DataPanel, LayerPanel, StatusBar  } from '.';

export const Init = () => {
    const _token = redux.store.getState().security.svSession;

    return spatial.ui.init(_token)
        .addControl(ToolsBar, {}, { position: 'top' })
        .addControl(DataPanel, {}, { position: 'left' })
        .addControl(LayerPanel, {}, { position: 'right' })
        .addControl(StatusBar, {}, { position: 'bottom', className: 'status-bar' })
        .withNavigationControl()
        .withWindRose()
        .render();
}