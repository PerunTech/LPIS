import { React, Loading, redux } from 'perun-core';
import { core, ui, config as cfg } from '../../../../Spatial';
import { getFarmMapAssets } from '../../../Util';
import { ProcessButton } from '../../ProcessButton';
import { Guidance } from './Guidance';
import { Form } from '../Form';
import { saveAP } from '../Save';

const { MAP_CONFIG } = cfg;
const { Map, store, factory } = core;
const { draw: { polygon } } = tools;
const { Icon, DrawActions } = ui;
const { useReducer } = React;
const _id = 'drawAP';

const _Draw = ({ processID, mapId, farmObjId }) => {
    const [{ layer, data, X, Y, loading, isGuided }, setState] = useReducer((currState, update) =>
        ({ ...currState, ...update }),
        { layer: {}, data: {}, X: 0, Y: 0, loading: false, isGuided: false });

    const _drawAP = () => {
        Map.on('new_shape', e => {
            (e && e.layer)
                && (setState({ layer: e.layer, isGuided: false }), e.layer.addTo(Map));
            Map.off('new_shape');
        });
        polygon.enable(config);
    }
    const _stopDrawAP = () => polygon.disable('force');

    const disable = (fn) => {
        // Reset state, internal and application-wide.
        setState({ layer: {}, data: {}, isGuided: false });
        store.dispatch({ processID: '', minZoom: MAP_CONFIG.minZoom });
        // We remove the working geometry, save process will add the result.
        layer.removeFrom && layer.removeFrom(Map);
        if (mapId === 'farm-registry-map') {
            const session = redux.store.getState().security.svSession
            getFarmMapAssets(session)
        }
        fn && fn();
    }

    const onChange = ({ formData }) =>
        setState({ data: { ...data, ...formData } });

    const onSubmit = ({ formData }) =>
        saveAP({
            ...data,
            ...formData,
            GEOM: factory.GeoJSON.fromLayer(layer),
            X: X,
            Y: Y,
            parent_id: farmObjId,
            OBJECT_ID: 0
        }, disable);

    const renderForm = () =>
    (isGuided
        ? <Guidance id={_id[1]}
            finish={() => polygon._finishShape()}
            undo={() => polygon._removeLastVertex()}
            disable={() => disable(_stopDrawAP)}
            msg={drawAPMsg}
            title='Нацртај земјоделска парцела' />
        : <Form onSubmit={onSubmit} onChange={onChange} formData={data} >
            <DrawActions
                cancel={() => disable(_stopDrawAP)} />
        </Form>)


    return <ProcessButton id={_id} onClick={_drawAP} >
        <Icon name={_id} size='30px' />
        <span style={{ display: 'block', marginTop: '5px' }}>Нацртај парцела</span>
        {processID === _id
            && renderForm()}
        {loading && <Loading />}
    </ProcessButton>;
};

export const Draw = core.connect(state => ({
    processID: state.app.processID, mapId: state.map.id, farmObjId: state.farmRegistry?.farmObjId
}))(_Draw)
