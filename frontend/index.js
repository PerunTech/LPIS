import { name, version, description } from '../package.json';
import * as core from './core';
import * as ui from './ui';

export const lpis = {
    name, 
    version, 
    description,
    routes: [{
        name: 'lpis',
        path: '/main/lpis',
        render: ui.Lpis,
        isExact: true
    }],
    core,
    ui
};