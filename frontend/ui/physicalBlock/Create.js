import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core';
import { PROCESS_ENUM, DRAW_PB } from '../../config';
import { Metadata } from './Metadata';

const { 
    core: { Map, store, factory, http }, 
    tools: { draw }, 
    ui: { Button, Icon, DrawActions } } = spatial;

/**
 * Create physical block.
 */
export const createPB = {
    _id: PROCESS_ENUM.createPB,

    _layer: {},

    enable () {
        Map.on('new_shape', function (e) { 
            (e && e.layer) 
                && (this._layer = e.layer); 
        }.bind(this));
        store.dispatch({ processID: this._id });
        draw.polygon.enable(DRAW_PB);
    },

    disable () {
        Map.off('new_shape');
        store.dispatch({processID: ''});
        
        this._layer = {};
        draw.polygon.disable('force');
    },

    _onSubmit ({ formData }) {
        console.log(this._layer)
        http.call('save_pb', { 
            data: JSON.stringify({ 
                ...formData, 
                GEOM: factory.GeoJSON.fromLayer(this._layer, Map.getCRS()) 
            }) 
        })
            .then(response => console.log(response))    // Add Alerts here.
            .catch(err => console.log(err));

        this.disable();
    },

    render ({processID, ...props}) {
        const { _id, enable, disable, _onSubmit} = createPB;

        return <Button {...props}
            id={_id} 
            className={processID === _id ? 'active' : ''}
            onClick={enable.bind(createPB)} >
                <Icon name={_id} size='34px' />
                <span style={{display: 'block', marginTop: '1px' }}>Додади физички блок</span>
                { processID === _id  
                    && <Metadata onSubmit={_onSubmit.bind(createPB)} >
                        <DrawActions
                            finish={() => draw.polygon._finishShape()} 
                            undo={() => draw.polygon._removeLastVertex()}
                            cancel={disable.bind(createPB)} />
                    </Metadata> }
        </Button>;
    }
}

createPB.render.propTypes = {
    processID: PropTypes.string,
}