import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core';
import { PROCESS_ENUM, DRAW_PB } from '../../config';

import { Metadata } from './Metadata';
import { renderPB } from './RenderPB';

const { Map, store, factory, http } = spatial.core;
const {tools: { edit }, ui: { Button, Icon, DrawActions }} = spatial;

const { useCallback, useState, useEffect } = React;
const _id = PROCESS_ENUM.editPB;

/**
 * Edit a physical block.
 * 
 * @param {*} props 
 */
export const EditPB = ({processID, ...props}) => {
    const [layer, setLayer] = useState({});

    const onSubmit = useCallback(({ formData }) => {
        disable();
        http.call('save_pb', { 
            data: JSON.stringify({ ...formData, GEOM: factory.GeoJSON.fromLayer(layer, Map.getCRS()) }) 
        })
            .then(response => console.log(response))    // Add Alerts here.
            .catch(err => console.log(err));
    }, [disable, layer])

    const enable = useCallback(() => {
        renderPB.byBBox();
        // Map.on('new_shape', _finishShape);
        store.dispatch({ processID: _id });
        edit.polygon.enable(DRAW_PB);
    }, []);

    const disable = useCallback(() => {
        renderPB.removeAll()
        // layer.removeFrom(Map);
        // Map.off('new_shape');
        store.dispatch({processID: ''});
        setLayer({})
        edit.polygon.disable();
    }, [setLayer]);

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

EditPB.propTypes = {
    processID: PropTypes.string,
}