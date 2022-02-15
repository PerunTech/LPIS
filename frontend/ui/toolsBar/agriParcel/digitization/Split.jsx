import { React, PropTypes, elements, redux } from 'perun-core';
import { core, tools, ui, data, cntConfig, ProcessButton, GuideForm, saveControl, getSpatialResults } from '../../..';

const { Map, store, factory, http, util } = core;
const { geobuf, protobuf } = data;
const { draw: { line } } = tools;
const { Button, Icon, DrawActions } = ui;
const { useReducer } = React;
const _id = 'split-control';

/**
 * Split spatial control.
 */
export const Split = ({ processID }) => {
    const [{ layer, data }, setState] = useReducer((currState, update) =>
        ({ ...currState, ...update }), { layer: {}, data: {} });

    const cleanup = (lineLayer) => {
        disable()
        Map.off('new_shape');
        //remove line
        if (lineLayer)
            lineLayer.removeFrom(Map);

    }

    const enable = () => {
        Map.on('new_shape', e => {



            if (e && e.layer) {
                elements.alertUser(true,
                    'warning',
                    'Дали сакате да го поделите резултатот од контрола',
                    'Дали сакате да го поделите резултатот од контрола на повеќе резултати',
                    splitParcel.bind(null, e.layer),
                    cleanup.bind(null, e.layer),
                    true,
                    'confirm',
                    'cancel'
                )

            } else
                cleanup();


        });
        store.dispatch({ processID: _id });
        line.enable(cntConfig);
    };

    const splitParcel = (lineLayer) => {

        http.call(_id, {
            url: '/WsOtscmIacs/SpatialControl/split/{init.token}/SPATIAL_CONTROL/' + redux.store.getState().mapData.cid,
            method: 'post',
            responseType: 'arraybuffer',
            data: JSON.stringify(factory.GeoJSON.fromLayer(lineLayer))
        })
            .then(response => {
                const geojson = factory.geoJSON(geobuf.decode(protobuf(response)), cntConfig.pathOptions);
                const stateData = store.getState().data.layers;

                geojson.getLayers().forEach(layer => {
                    const id = layer.feature.id

                    // remove old app layers entries, will update with the new geojson set.
                    stateData[id] && stateData[id].removeFrom(Map);

                    // Flatten the geometry array, so utilities can read the thing. god knows why this happens.
                    // Revise this
                    // layer.setLatLngs([...util.flattenDeep(layer.getLatLngs())])
                    // layer.addTo(Map);

                })
                elements.alertUser(true,
                    'success',
                    'Успешно поделена просторна контрола',
                    'Добиени се ' + geojson.getLayers().length + ' нови парцели.',
                    getSpatialResults
                )
            })
            .catch(error => {
                let enc = new TextDecoder("utf-8");
                let errmsg = enc.decode(error.response.data);
                console.log();
                elements.alertUser(true,
                    'error',
                    'Грешка при поделба просторна контрола',
                    errmsg,
                    getSpatialResults
                );

            })

        //remove line   
        cleanup(lineLayer);
    }



    const disable = () => {
        // Reset state, internal and application-wide.
        setState({ layer: {}, data: {} });
        store.dispatch({ processID: '' });

        // We remove the working geometry, save process will add the result.
        layer.removeFrom && layer.removeFrom(Map);
        // Disable Split handler.
        line.disable('force');
    }

    const onChange = ({ formData }) =>
        setState({ data: { ...data, ...formData } });

    const onSubmit = ({ formData }) =>
        saveControl(JSON.stringify({ ...data, ...formData, GEOM: factory.GeoJSON.fromLayer(layer) }), disable);

    return <ProcessButton id={_id} onClick={enable} className={processID === _id ? 'active' : ''} >
        <Icon name={_id} size='28px' style={{ marginTop: '2px' }} />
        <span style={{ display: 'block', marginTop: '5px' }}>Подели парцела</span>
        {processID === _id
            && <GuideForm id={_id}
                finish={() => polygon._finishShape()}
                undo={() => polygon._removeLastVertex()}
                disable={disable}
                msg={['', '']}
                title='Подели парцела' />}
    </ProcessButton>;
};

Split.propTypes = {
    processID: PropTypes.string,
}
