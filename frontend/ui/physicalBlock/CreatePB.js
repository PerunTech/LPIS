import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core';
import { PROCESS_ENUM, DRAW_PB } from '../../config';
import { Metadata } from './Metadata';

const { Map, store, factory } = spatial.core;
const { draw } = spatial.tools;
const {  Button, Icon } = spatial.ui;

export const createPB = {
    id: PROCESS_ENUM.createPB,

    feature: {},

    enable () {
        Map.on('new_shape', this._finishShape.bind(this));
        store.dispatch({ processID: this.id });
        draw.polygon.enable(DRAW_PB);
    },

    disable () {
        Map.off('new_shape');
        store.dispatch({processID: ''});
        draw.polygon.disable('force');
    },

    _finishShape (e) {
        (e && e.layer) 
            && (this.feature = factory.GeoJSON.fromLayer(e.layer, Map.getCRS()));
    },
    
    render: ({processID, ...props}) => {
        const { id, enable } = createPB;

        return <Button {...props}
            id={id} 
            className={processID === id ? 'active' : ''}
            onClick={enable.bind(createPB)} >
                <Icon name={id} size='34px' />
                <span style={{display: 'block', marginTop: '1px' }}>Додади физички блок</span>
                { processID === id && <Metadata tool={createPB} /> }
        </Button>;
    }
}

createPB.render.displayName = 'CreatePB';
createPB.render.propTypes = {
    processID: PropTypes.string,
}