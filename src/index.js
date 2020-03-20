import { React, ReactDOM } from 'perun-core';
import { App } from 'perun-core'

export const plugin = {
    init: () => {}
};
ReactDOM.render(<App />, document.getElementById('app'));