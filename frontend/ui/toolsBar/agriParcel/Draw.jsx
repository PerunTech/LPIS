import { React, PropTypes } from 'perun-core';
import { core, tools, ui } from '../../../Spatial';
import { config, drawAPMsg } from './Config';
import { Form } from './Form';
import { Guidance } from './Guidance';
import { saveAP } from './Save';

const { Map, store, factory } = core;
const { draw: { polygon } } = tools;
const { Button, Icon, DrawActions } = ui;
const { useReducer } = React;
const _id = 'drawAP';

/**
 * Draw an agri parcel.
 */
export const Draw = ({ processID }) => {
    const [{layer, data, isGuided}, setState] = useReducer((currState, update) => 
        ({...currState, ...update}), { layer: {}, data: {}, isGuided: false });

    const enable = () => {
        Map.on('new_shape', e => {
            (e && e.layer) 
                && (setState({layer: e.layer, isGuided: false}), e.layer.addTo(Map));
            Map.off('new_shape');
        });

        setState({isGuided: true})
        store.dispatch({ processID: _id });
        polygon.enable(config);
    };

    const disable = () => {
        // Reset state, internal and application-wide.
        setState({ layer: {}, data: {} });
        store.dispatch({processID: ''});

        // We remove the working geometry, save process will add the result.
        layer.removeFrom && layer.removeFrom(Map);
        // Disable draw handler.
        polygon.disable('force');
    }

    const onChange = ({ formData }) => 
        setState({data: { ...data, ...formData }});

    const onSubmit = ({ formData }) => 
        saveAP(JSON.stringify({ 
            ...data, 
            ...formData,
            OBJECT_ID: 0,
            GEOM: factory.GeoJSON.fromLayer(layer) }), disable);

    const renderForm = () =>
        isGuided
            ? <Guidance id={_id}
                finish={() => polygon._finishShape()} 
                undo={() => polygon._removeLastVertex()} 
                disable={disable} 
                msg={drawAPMsg} 
                title='Нацртај земјоделска парцела' />
            : <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
                <DrawActions 
                    cancel={disable} />
            </Form>;

    return <Button id={_id} onClick={enable} className={processID === _id ? 'active' : ''} >
        <Icon name={_id} size='28px' style={{marginTop: '2px'}} />
        <span style={{display: 'block', marginTop: '5px' }}>Нацртај парцела</span>
        {processID === _id && renderForm()}
    </Button>;
};

Draw.propTypes = {
    processID: PropTypes.string,
}