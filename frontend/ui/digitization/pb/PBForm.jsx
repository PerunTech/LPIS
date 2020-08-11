import { React } from 'perun-core';
import { spatial } from '../../../core';

const { useState, useEffect } = React;
const { http, store } = spatial.core;

store.addState('http', {
    add_pb_data: {
        url: '/ReactElements/getTableFormData/{init.token}/0/PHYSICAL_BLOCK',
        method: 'get',
        responseType: 'application/json'
    },
    add_pb_ui: {
        url: '/ReactElements/getTableUISchema/{init.token}/PHYSICAL_BLOCK',
        method: 'get',
        responseType: 'application/json'
    },
    add_pb_json: {
        url: '/ReactElements/getTableJSONSchema/{init.token}/PHYSICAL_BLOCK',
        method: 'get',
        responseType: 'application/json'
    }
});

export const PBForm = () => {
    const [formContent, setFormContent] = useState(null);
    
    useEffect(() => {
        console.log(store.getState())
        http.callConcurrently(['add_pb_data', 'add_pb_ui', 'add_pb_json'])
            .then(response => console.log(response))
    }, [])

    return <>{ formContent }</>;
}