import { spatial } from '../../core';

const { core: { store, factory, http }, config: { MIN_DIGI_SCALE, MAP_CONFIG } } = spatial;

export const renderPB = {
    pbGroup: new factory.LayerGroup(),

    byBBox () {
        store.dispatch({minZoom: MIN_DIGI_SCALE});
        console.log(store.getState())

        http.call('render_pb')
            .then(response => console.log(response))
            .catch(err => console.log(err))
    },

    removeAll () {
        store.dispatch({minZoom: MAP_CONFIG.minZoom});
    }
}