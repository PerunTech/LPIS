import { React } from 'perun-core';
import { spatial } from '../../../core';

const { useState, useEffect } = React;
const { http, store } = spatial.core;

//const currSlice = { ...store.getState().http };
//store.removeState('http');
store.extendState('http', {
    addPB_data: {
        url: '/services/ReactElements/getTableFormData/{init.token}/0/PHYSICAL_BLOCK',
        method: 'get',
        responseType: 'application/json'
    },
    addPB_ui: {
        url: '/services/ReactElements/getTableUISchema/{init.token}/PHYSICAL_BLOCK',
        method: 'get',
        responseType: 'application/json'
    },
    addPB_json: {
        url: '/services/ReactElements/getTableJSONSchema/{init.token}/PHYSICAL_BLOCK',
        method: 'get',
        responseType: 'application/json'
    }
});

export const PBForm = () => {
    const [formContent, setFormContent] = useState(null);
    
    useEffect(() => {
        console.log(store.getState())
        http.callConcurrently(['addPB_data', 'addPB_ui', 'addPB_json'])
            .then(response => console.log(response))
    }, [])

    return <>{ formContent }</>;
}