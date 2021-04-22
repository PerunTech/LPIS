import { React, PropTypes } from 'perun-core';
import { core, tools, ui } from '../../../Spatial';
import { config, drawCPMsg } from './Config';
import { Form } from './Form';
import { Guidance } from './Guidance';
import { saveCP } from './Save';
import { ProcessButton } from '../..';

const { Map, store, factory, http } = core;
const { draw: { polygon } } = tools;
const { Icon, DrawActions } = ui;
const { useReducer } = React;
const _id = 'drawCP';

/**
 * Draw crop parcel.
 */
export const Draw = ({ processID, farmerId }) => {
    const [{layer, data, enumIdx, enumNames, isGuided}, setState] = useReducer((currState, update) => 
        ({...currState, ...update}), { layer: {}, data: {}, enumIdx: [], enumNames: [], isGuided: false });

    const enable = () => {
        Map.on('new_shape', e => {
            if (e && e.layer) {
                setState({layer: e.layer})
                e.layer.addTo(Map)

                http.call('get_code_list', {
                    method: 'post',
                    url: '/lpis/get/cropList/{gsaa.token}/{gsaa.farmerId}',
                    data: JSON.stringify({ 
                        ...data, 
                        GEOM: factory.GeoJSON.fromLayer(e.layer) }),
                })
                .then(response => {
                    setState({enumIdx: response.data.enum, enumNames: response.data.enumNames})
                    setState({isGuided: false})
                })
                .catch(err => {
                    console.log(err);
                    disable();
                })
            } 
            Map.off('new_shape');
        });

        setState({isGuided: true})
        store.dispatch({ processID: _id });
        polygon.enable(config);
    };

    const disable = () => {
        // Reset state, internal and application-wide.
        setState({ layer: {}, data: {}, enumIdx: [], enumNames: [] });
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
            : <Form onSubmit={onSubmit} onChange={onChange} formData={data} enumIdx={enumIdx} enumNames={enumNames} >
                <DrawActions 
                    cancel={disable} />
            </Form>;

    return <ProcessButton id={_id} onClick={enable} >
        <Icon name={_id} size='32px' />
        <span style={{display: 'block', marginTop: '2px' }}>Нацртај производна парцела</span>
        {processID === _id && renderForm()}
    </ProcessButton>;
};

Draw.propTypes = {
    processID: PropTypes.string,
    farmerId: PropTypes.number
}