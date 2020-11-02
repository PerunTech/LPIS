import { React, PropTypes, elements } from 'perun-core';
import { spatial } from '../../../core';
import { PROCESS_ENUM, PB_CONF } from '../../../config';

const { 
    core: { Map, store, factory, http }, 
    tools: { draw }, 
    ui: { Button, Icon, DrawActions } } = spatial;

/**
 * Create a physical block.
 */
export const createAP = {
    _id: PROCESS_ENUM.createAP,

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
            this._layer.removeFrom(Map);
            this.disable();
            elements.alertUser(true, 'error', 'Грешка при зачувување', 'Физичкиот блок не е запишан во базата на податоци.')
        })
    },

    _finishShape (e) {
        (e && e.layer) 
            && (this._layer = e.layer, e.layer.addTo(Map));
    },

    render ({processID, ...props}) {
        const { _id, enable, disable, _onSubmit} = createAP;

        return <Button {...props}
            id={_id} 
            className={processID === _id ? 'active' : ''}
            onClick={enable.bind(createAP)} >
                <Icon name={_id} size='34px' />
                <span style={{display: 'block', marginTop: '1px' }}>Додади физички блок</span>
                { processID === _id  
                    && <BlockMetadata onSubmit={_onSubmit.bind(createAP)} >
                        <DrawActions
                            finish={() => draw.polygon._finishShape()}
                            undo={() => draw.polygon._removeLastVertex()}
                            cancel={disable.bind(createAP)} />
                    </BlockMetadata> }
        </Button>;
    }
}

createAP.render.propTypes = {
    processID: PropTypes.string,
}