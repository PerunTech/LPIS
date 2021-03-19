import { React, PropTypes } from 'perun-core';
import { core, tools, ui } from '../../../Spatial';
import { config, drawCPMsg } from './Config';
import { Form } from './Form';
import { Guidance } from './Guidance';
import { saveCP } from './Save';

const { Map, store, factory } = core;
const { draw: { polygon } } = tools;
const { Button, Icon, DrawActions } = ui;
const { useReducer } = React;
const _id = 'drawCP';

/**
 * Draw crop parcel.
 */
export const Draw = ({ processID, farmerId }) => {
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

    const onSubmit = ({ formData }) => {
        saveCP(JSON.stringify({ 
            ...data, 
            ...formData,
            parent_id: farmerId,
            GEOM: factory.GeoJSON.fromLayer(layer) }), disable);
    }


    const renderForm = () =>
        isGuided
            ? <Guidance id={_id}
                finish={() => polygon._finishShape()} 
                undo={() => polygon._removeLastVertex()} 
                disable={disable} 
                msg={drawCPMsg} 
                title='Нацртај производна парцела' />
            : <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
                <DrawActions 
                    cancel={disable} />
            </Form>;

    return <Button id={_id} onClick={enable} className={processID === _id ? 'active' : ''} >
        <Icon name={_id} size='32px' />
        <span style={{display: 'block', marginTop: '2px' }}>Нацртај производна парцела</span>
        {processID === _id && renderForm()}
    </Button>;
};

Draw.propTypes = {
    processID: PropTypes.string,
    farmerId: PropTypes.number
}