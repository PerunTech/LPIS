import { React, PropTypes, elements } from 'perun-core';
import { spatial } from '../../core';
import { PROCESS_ENUM, PB_CONF } from '../../config';
import { BlockMetadata } from './BlockMetadata';

const { 
    core: { Map, store, factory, http }, 
    tools: { draw }, 
    ui: { Button, Icon, DrawActions } } = spatial;

/**
 * Create a physical block.
 */
export const createBlock = {
    _id: PROCESS_ENUM.createBlock,

    _layer: {},

    enable () {
        Map.on('new_shape', this._finishShape.bind(this));
        store.dispatch({ processID: this._id });
        draw.polygon.enable(PB_CONF);
    },

    disable () {
        Map.off('new_shape');
        store.dispatch({processID: ''});
        
        // this._layer.removeFrom && this._layer.hideMeasurements();
        this._layer = {};
        draw.polygon.disable('force');
    },

    _onSubmit ({ formData }) {
        http.call('save_pb', { 
            data: JSON.stringify({ 
                ...formData, 
                GEOM: factory.GeoJSON.fromLayer(this._layer) 
            }) 
        }).then(() => {
            this.disable();
            elements.alertUser(true, 'success', 'Успешно зачувување', 'Физичкиот блок е запишан во базата на податоци.')
        }).catch(() => {
            const data = { ...store.getState().data[dc.data_pb] }
            delete data[this._genLayerId(this._layer)];
            store.dispatch({ [dc.data_pb]: data });
            
            this._layer.removeFrom(Map);
            this.disable();
            elements.alertUser(true, 'error', 'Грешка при зачувување', 'Физичкиот блок не е запишан во базата на податоци.')
        })
    },

    _finishShape (e) { 
        (e && e.layer) 
            && (this._layer = e.layer); 
    },

    _genLayerId (layer) {
        return String('Нов блок ' + layer._leaflet_id);
    },

    render ({processID, ...props}) {
        const { _id, enable, disable, _onSubmit} = createBlock;

        return <Button {...props}
            id={_id} 
            className={processID === _id ? 'active' : ''}
            onClick={enable.bind(createBlock)} >
                <Icon name={_id} size='34px' />
                <span style={{display: 'block', marginTop: '1px' }}>Додади физички блок</span>
                { processID === _id  
                    && <BlockMetadata onSubmit={_onSubmit.bind(createBlock)} >
                        <DrawActions
                            finish={() => draw.polygon._finishShape()} 
                            undo={() => draw.polygon._removeLastVertex()}
                            cancel={disable.bind(createBlock)} />
                    </BlockMetadata> }
        </Button>;
    }
}

createBlock.render.propTypes = {
    processID: PropTypes.string,
}