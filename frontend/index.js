import { name, version, description } from '../package.json';
// Import all assets
import './assets';
// Import all publishable modules.
import * as ui from './ui';

export const lpis = {
    name, 
    version, 
    description,
    routes: [{
        name: 'gsaa',
        path: '/main/gsaa',
        render: ui.gsaa,
        isExact: true
    }, {
        name: 'lpis',
        path: '/main/lpis',
        render: ui.lpis,
        // render: ui.gsaa,
        isExact: true
    }],
    ui
};