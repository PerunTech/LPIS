import { spatial } from '../core';

export const Lpis = () => {
    return spatial.ui.init('token')
        .withStatusBar ()
        .withToolsBar()
        .withLayerPanel()
        .withDataPanel()
        .withNavigationControl()
        .withWindRose()
        .render();
}