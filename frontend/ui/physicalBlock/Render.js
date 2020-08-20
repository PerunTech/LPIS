import { spatial } from '../../core';

const { core: { store, factory, http }, 
        config: { MIN_DIGI_SCALE, MAP_CONFIG },
        data: { protobuf, geobuf } } = spatial;

export const render = {
    pbGroup: new factory.LayerGroup(),

    byBBox () {
        store.dispatch({minZoom: MIN_DIGI_SCALE});

        http.call('render_pb')
            .then(response => console.log(geobuf.decode(protobuf(response))))
            .catch(err => console.log(err))
    },

    removeAll () {
        store.dispatch({minZoom: MAP_CONFIG.minZoom});
    }
}