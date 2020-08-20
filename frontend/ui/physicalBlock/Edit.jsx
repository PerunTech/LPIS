import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core';
import { PROCESS_ENUM } from '../../config';

import { Metadata } from './Metadata';
import { render } from './Render';

const { Map, store, factory, http, connect } = spatial.core;
const {tools: { edit }, ui: { Button, Icon, DrawActions }} = spatial;

const { useCallback, useState, useEffect } = React;
const _id = PROCESS_ENUM.editPB;

/**
 * Edit a physical block.
 * 
 * @param {*} props 
 */
const _Edit = ({processID, bbox, ...props}) => {
    const [layer, setLayer] = useState({});

    useEffect(() => {
        (bbox && processID === _id) && render.byBBox();
        return render.removeAll(); }, [ bbox, processID ]) 

    const onSubmit = useCallback(({ formData }) => {
        disable();
        http.call('save_pb', { 
            data: JSON.stringify({ ...formData, GEOM: factory.GeoJSON.fromLayer(layer, Map.getCRS()) }) 
        })
            .then(response => console.log(response))    // Add Alerts here.
            .catch(err => console.log(err));
    }, [disable, layer]);

    const enable = useCallback(() => {
        render.byBBox();
        // Map.on('new_shape', _finishShape);
        store.dispatch({ processID: _id });
        edit.polygon.enable(); }, []);

    const disable = useCallback(() => {
        render.removeAll()
        // layer.removeFrom(Map);
        // Map.off('new_shape');
        store.dispatch({processID: ''});
        setLayer({})
        edit.polygon.disable(); }, [setLayer]);

    return <Button {...props}
        id={_id} 
        className={processID === _id ? 'active' : ''}
        onClick={enable} >
            <Icon name={_id} size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Промени физички блок</span>
            { processID === _id  
                && <Metadata onSubmit={onSubmit} >
                    <DrawActions
                        cancel={disable} />
                </Metadata> }
    </Button>;
}

_Edit.propTypes = {
    processID: PropTypes.string,
    bbox: PropTypes.string
}

export const Edit = connect(state => 
    ({ bbox: state.map.bbox }))(_Edit);
