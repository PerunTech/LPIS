import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core';
import { PROCESS_ENUM, DRAW_PB } from '../../config';
import { Metadata } from './Metadata';

const { Map, store, factory, http } = spatial.core;
const { edit } = spatial.tools;
const {  Button, Icon, DrawActions } = spatial.ui;
const { useCallback, useState, useEffect } = React;
const _id = PROCESS_ENUM.editPB;

export const EditPB = ({processID, ...props}) => {
    const [layer, setLayer] = useState({});

    const _finishShape = useCallback(e => {
        (e && e.layer) 
            && setLayer(e.layer);
    }, [setLayer]);

    const onSubmit = useCallback(({ formData }) => {
        disable();
        http.call('save_pb', { 
            data: JSON.stringify({ ...formData, GEOM: factory.GeoJSON.fromLayer(layer, Map.getCRS()) }) 
        })
            .then(response => console.log(response))    // Add Alerts here.
            .catch(err => console.log(err));
    }, [disable, layer])

    const enable = useCallback(() => {
        // Map.on('new_shape', _finishShape);
        store.dispatch({ processID: _id });
        edit.polygon.enable(DRAW_PB);
    }, [_finishShape]);

    const disable = useCallback(() => {
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