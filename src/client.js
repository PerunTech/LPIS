/**
 * This file is the entry point to the build of the project web resources,
 * when running a development environment*. 
 * 
 * This file must register with Core (perun-core), in order for the plugin to work.
 * In order to sucessfully register, import your plugin from the production entry point,
 * most commonly a sibling file named index.js.
 * 
 * When an import is made, like in the code below `import * as plugin from './index';`,
 * all exports specified in index.js are assembled into an object and imported here
 * with the named variable `plugin` (call it what you like) pointing to that object.
 * 
 * To make a register entry, call the pluginManager with:
 *  - The name of your plugin, by convention the name specified in package.json
 *  - Your plugin implementation, assembled as an object.
 * 
 * You can change this default entry to another one, given that you change this line in webpack.config.js:
 *   - entry: env === 'production' ? './src/index.js' : './src/client.js'
 * Change client.js path above to the path of your desired dev entry file. Remember to do the exact steps
 * shown here in your newly created file.
 */
import { pluginManager } from 'perun-core';
import { name } from '../package.json'
import * as plugin from './index';

pluginManager.registerPlugin(name, plugin);

/**
 * < Clarifications >
 * 1. development environment - means writing code, developing this project. This is initiated 
 * with the provided npm scripts:
 *  - npm run build-dev, in order to build the code into a minified bundle file.
 *  - npm run dev, in order to run a web-server and see the output of your code (such as na app) in the browser.
 */