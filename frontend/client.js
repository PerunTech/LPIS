import { pluginManager } from 'perun-core';
import { spatial } from 'spatial';
import { lpis } from './index';

// Router reads the routes off `window.lpis`, which the loader takes from this
// bundle's exports, so the dev entry exposes what the production entry does.
export * from './index';

// register spatial plugin dependency.
pluginManager.registerPlugin(spatial.name, spatial); 

// register self.
pluginManager.registerPlugin(lpis.name, lpis);