import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core';
import { PROCESS_ENUM } from '../../config';

import { Metadata } from './Metadata';
import { render } from './Render';

const { Map, store, factory, http, connect } = spatial.core;
const {tools: { edit }, ui: { Button, Icon, DrawActions }} = spatial;

// const { useState } = React;

/**
 * Edit a physical block.
 */
export const editPB = {
    _id: PROCESS_ENUM.editPB,

    enable () {
        render.byBBox();
        store.dispatch({ processID: this._id });
        edit.polygon.enable();
    },

    disable () {
        render.removeAll()
        store.dispatch({processID: ''});
        edit.polygon.disable();
    },

    onSubmit ({formData}, layer) {
        this.disable();
        http.call('save_pb', { 
            data: JSON.stringify({ ...formData, GEOM: factory.GeoJSON.fromLayer(layer, Map.getCRS()) }) 
        })
            .then(response => console.log(response))    // Add Alerts here.
            .catch(err => console.log(err));
    },

    render: connect(state => ({ bbox: state.map.bbox })) (({processID, bbox, ...props}) => {
        // const [layer, setLayer] = useState({});
        const { enable, disable, onSubmit, _id } = editPB;

        return <Button {...props}
            id={_id} 
            className={processID === _id ? 'active' : ''}
            onClick={enable.bind(editPB)} >
                <Icon name={_id} size='30px' />
                <span style={{display: 'block', marginTop: '5px' }}>Промени физички блок</span>
                { processID === _id  
                    && <Metadata onSubmit={onSubmit.bind(editPB)} >
                        <DrawActions
                            cancel={disable.bind(editPB)} />
                    </Metadata> }
        </Button>;
    })       
}

editPB.render.propTypes = {
    processID: PropTypes.string,
    bbox: PropTypes.string
};
