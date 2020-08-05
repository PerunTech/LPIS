import { spatial } from '../core';
import { ToolsBar, DataPanel, LayerPanel, StatusBar  } from '.';

export const Lpis = () => {
    return spatial.ui.init('token')
        .addControl(ToolsBar, {}, { position: 'top' })
        .addControl(DataPanel, {}, { position: 'left' })
        .addControl(LayerPanel, {}, { position: 'right' })
        .addControl(StatusBar, {}, { position: 'bottom', className: 'status-bar' })
        .withNavigationControl()
        .withWindRose()
        .render();
}