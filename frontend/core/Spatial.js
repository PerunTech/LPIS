import { pluginManager } from 'perun-core';

export const spatial = { 
    init () {
        return this.name 
            ? this
            : Object.assign(this, pluginManager.getPlugin('spatial'));
    }
};

