import { name, version, description } from '../package.json';
// Import all assets
import './assets';
// Import all publishable modules.
import * as core from './core';
import * as ui from './ui';

export const lpis = {
    name, 
    version, 
    description,
    routes: [{
        name: 'lpis',
        path: '/main/lpis',
        render: ui.Init,
        isExact: true
    }],
    core,
    ui
};