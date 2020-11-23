import { React, PropTypes, elements } from 'perun-core';
import { core, tools, ui } from '../../../Spatial';
import { config } from './Config';
import { Form } from './Form';

const { Map, store, factory, http } = core;
const { draw } = tools;
const { Button, Icon, DrawActions } = ui;

/**
 * Create a physical block.
 */
export const createAP = {
    _id: 'createAP',
    _layer: {},
    _formData: {},

    enable () {
        Map.on('new_shape', this._finishShape.bind(this));
        store.dispatch({ processID: this._id });
        draw.polygon.enable(config);
    },

    disable () {
        Map.off('new_shape');
        store.dispatch({processID: ''});
        this._layer = {};
        this._formData = {};
        draw.polygon.disable('force');
    },

    _onChange ({ formData }) {
        this._formData = { ...this._formData, ...formData};
    },

    _onSubmit ({ formData }) {
        http.call('save_ap', {
            data: JSON.stringify({ 
                ...{...this._formData, ...formData}, 
                GEOM: factory.GeoJSON.fromLayer(this._layer)
            }) 
        }).then(() => {
            this.disable();
            elements.alertUser(true, 'success', 'Успешно зачувување', 'Земјоделската парцела е запишана во базата на податоци.')
        }).catch(() => {
            this._layer.removeFrom(Map);
            this.disable();
            elements.alertUser(true, 'error', 'Грешка при зачувување', 'Земјоделската парцела не е запишана во базата на податоци.')
        })
    },

    _finishShape (e) {
        (e && e.layer) 
            && (this._layer = e.layer, e.layer.addTo(Map));
    },

    render ({processID}) {
        const { _id, enable, disable, _onChange, _onSubmit} = createAP;

        return <Button
            id={_id} 
            className={processID === _id ? 'active' : ''}
            onClick={enable.bind(createAP)} >
                <Icon name={_id} size='30px' />
                <span style={{display: 'block', marginTop: '5px' }}>Додади земјоделска парцела</span>
                { processID === _id  
                    && <Form onSubmit={_onSubmit.bind(createAP)} onChange={_onChange.bind(createAP)} >
                        <DrawActions
                            finish={() => draw.polygon._finishShape()}
                            undo={() => draw.polygon._removeLastVertex()}
                            cancel={disable.bind(createAP)} />
                    </Form> }
        </Button>;
    }
}

createAP.render.propTypes = {
    processID: PropTypes.string,
}