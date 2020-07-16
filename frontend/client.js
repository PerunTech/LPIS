import { pluginManager } from 'perun-core';
import { name } from '../package.json'
import * as plugin from './index';

pluginManager.registerPlugin(name, plugin);