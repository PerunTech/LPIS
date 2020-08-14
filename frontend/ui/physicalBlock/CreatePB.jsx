import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core';
import { PROCESS_ENUM, DRAW_PB } from '../../config';
import { Metadata } from './Metadata';

const { Map, store, factory, http } = spatial.core;
const { draw } = spatial.tools;
const {  Button, Icon, DrawActions } = spatial.ui;
const { useCallback, useState } = React;
const _id = PROCESS_ENUM.createPB;

export const CreatePB = ({processID, ...props}) => {
    const [feature, setFeature] = useState({});

    const _finishShape = useCallback(e => {
        (e && e.layer) 
            && setFeature(factory.GeoJSON.fromLayer(e.layer, Map.getCRS()));
    }, [setFeature]);

    const onSubmit = useCallback(({ formData }) => {
        disable()
        http.call('save_pb', { data: JSON.stringify({ ...formData, GEOM: feature }) });
    }, [disable, feature])

    const enable = useCallback(() => {
        Map.on('new_shape', _finishShape);
        store.dispatch({ processID: _id });
        draw.polygon.enable(DRAW_PB);
    }, [_finishShape]);

    const disable = useCallback(() => {
        Map.off('new_shape');
        store.dispatch({processID: ''});
        setFeature({})
        draw.polygon.disable('force');
    }, [setFeature]);

    return <Button {...props}
        id={_id} 
        className={processID === _id ? 'active' : ''}
        onClick={enable} >
            <Icon name={_id} size='34px' />
            <span style={{display: 'block', marginTop: '1px' }}>Додади физички блок</span>
            { processID === _id  
                && <Metadata onSubmit={onSubmit} >
                    <DrawActions
                        finish={() => draw.polygon._finishShape()} 
                        undo={() => draw.polygon._removeLastVertex()}
                        cancel={disable} />
                </Metadata> }
    </Button>;
}

CreatePB.propTypes = {
    processID: PropTypes.string,
}