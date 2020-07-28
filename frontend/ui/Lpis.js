import { factory } from '../core';

export const Lpis = () => {
    return factory.ui.init('token')
        .withStatusBar ()
        .withToolsBar()
        .withLayerPanel()
        .withDataPanel()
        .withNavigationControl()
        .withWindRose()
        .render();
}