/**
 * This file is the production entry point to the project web resources*.
 * 
 * This file must export all resources (routes, modules, classes, scripts, variables, css) that comprise the plugin*.
 * In order to do that, we first import these resources from the internal folder structure,
 * assign them under named variables and then we export those named variables.
 * 
 * If the plugin renders anything in the browser (outputs DOM elements),
 * routes must be specified, such that:
 *  - we export a list of routes, each element is an individual route
 *  - each route is represented by an object, with the following attributes:
 *      - name => the internal reference name to the route
 *      - path => the URL path of the route.
 *      - render => The markup to be rendered at the specified path, usually a React component.
 *      - isExact => boolean flag, indicates whether an exact match of the URL is required, use true in most cases.
 *      - example: { name: 'demo', path: '/main/demo', render: Main, isExact: true }
 *  - You need to specify at least one route (the main route) from which the App will go to the plugin.
 *  - In case the plugin uses multiple routes internally, declare those as well as elements of the routes list.
 *  - You do not need to nest sub-routes, provide a simple flat list of objects.
 * 
 * 
 * You can change this default entry to another one, given that you change this line in webpack.config.js:
 *   - entry: env === 'production' ? './src/index.js' : './src/client.js'
 * Change index.js path above to the path of your desired dev entry file.
 * Change the import statement in the development entry (client.js by default) to import from you newly created
 * production entry file.
 * Remember to do the exact steps shown here in the new production entry.
 */

/**
 * @example
import * as assets from './assets'; // eslint-disable-line
import { Main } from './proto/Main';
import { TestForm } from './proto/Form';
import { Sandwiches } from './proto/Sandwiches';
import { Ticker } from './proto/Ticker';
const routes = [{
    name: 'demo',
    path: '/main/demo',
    render: Main,
    isExact: true
}, {
    name: 'kickAssForm',
    path: '/main/demo/kick-ass-form',
    render: TestForm,
    isExact: true
}, {
    name: 'sandwiches',
    path: '/main/demo/sandwiches',
    render: Sandwiches,
    isExact: true
}, {
    name: 'ticker',
    path: '/main/demo/tick-tock',
    render: Ticker,
    isExact: true
}]

export { Main, TestForm, Sandwiches, Ticker, routes };
 */


/**
 * < Clarifications >
 * 1. production environment - means the final expected output of the plugin, 
 * the script that is goint to be delivered to the client.
 * 
 * 2. The phrase export all things that the plugin should include does not mean every single file.
 * Render modules, such as React Components, should most commonly export only the top Component (root).
 * The bundler will include all children of the potential DOM tree rendered by that root.
 * 
 * For further info, please see:
 *  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
 *  - https://webpack.js.org/guides/getting-started/#creating-a-bundle
 *  - https://webpack.js.org/guides/tree-shaking/
 */