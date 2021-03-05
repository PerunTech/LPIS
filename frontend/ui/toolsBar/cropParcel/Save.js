import { core, data } from '../../../Spatial';

const { http, store, factory, Map, util } = core;
const { protobuf, geobuf } = data;

export const saveCP = (data, callback) => {
    http.call('save_cp', {
        url: '/table/createTableRecord/{init.token}/LAND_USE_PLAN/0/null/0/null/null',
        data: data
    })
    .then(response => (callback(), console.log(response)))
    .catch(err => (callback(), console.log(err)))
};