import { elements } from 'perun-core';
import { core } from '../../../Spatial';

const { http } = core;

export const saveParcel = (data, callback) => {
    // This will call the callback with just the isLoading argument as true
    // so we can display a loader while waiting for a response
    callback('', undefined, true)
    // inject object id instead of cid
    http.call('save_parcel', {
        method: 'post',

        url: '/lpis/save/agriParcel/{init.token}/' + data.OBJECT_ID + '/' + data.parent_id + '/2',
        data: JSON.stringify(data),
        responseType: 'arraybuffer'
    })
        .then(response => {
            if (response.data.type === 'ERROR' || response.data.type === 'EXCEPTION') {
                elements.alertUser(true,
                    'error',
                    response.data.title || 'Грешка при зачувување',
                    response.data.message || 'Просторната контрола не е запишана во базата на податоци.');
            }

            elements.alertUser(true,
                'success',
                'Успешно зачувување',
                'Просторната контрола е запишана во базата на податоци.');

            // must implement getSpatialResults, responsibility defered to caller.
            callback();
        })
        .catch((err) => {
            const { response } = err
            callback('error', response, false)
        })
}