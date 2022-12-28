import { name, version, description } from '../package.json';
// Import all assets
import './assets';
// Import all publishable modules.
import * as ui from './ui';
// Get all available layers
import { getGeoTypeLayers } from './ui/Util';
getGeoTypeLayers();

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
        isExact: true
    }, {
        name: 'lpis_farm_registry',
        path: '/main/farm-registry/map',
        render: ui.farmRegLpis,
        isExact: true
    }],
    ui
};