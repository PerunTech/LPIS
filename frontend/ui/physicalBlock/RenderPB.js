import { spatial } from '../../core';

const { core: { store }, config: { MIN_DIGI_SCALE, MAP_CONFIG } } = spatial;

export const renderPB = {
    byBBox () {
        store.dispatch({minZoom: MIN_DIGI_SCALE});
    },

    removeAll () {
        store.dispatch({minZoom: MAP_CONFIG.minZoom});
    }
}