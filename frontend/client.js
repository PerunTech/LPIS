import { pluginManager } from 'perun-core';
import { spatial } from 'spatial';
import { lpis } from './index';

// register spatial plugin dependency
pluginManager.registerPlugin(spatial.name, spatial); 

// register self.
pluginManager.registerPlugin(lpis.name, lpis);