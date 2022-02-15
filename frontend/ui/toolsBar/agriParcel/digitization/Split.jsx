import { React, elements } from 'perun-core';
import { core, ui, data, tools } from '../../../../Spatial';
import { config } from '../Config';
import { getFarmMapAssets } from '../../../Util';
import { Guidance } from '../Guidance';
import { ProcessButton } from '../../ProcessButton';

const { Map, store, factory, http } = core;
const { geobuf, protobuf } = data;
const { draw: { polygon, line } } = tools;
const { Icon } = ui;
const { useReducer } = React;
const _id = 'split-control';

/**
 * Split spatial control.
 */
const _Split = ({ processID, farmObjId }) => {
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
                    'Дали сакате да ја поделите парцелата',
                    'Дали сакате да ја поделите парцелата на повеќе помали парцели',
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
        line.enable(config);
    };

    const splitParcel = (lineLayer) => {

        http.call(_id, {
            url: '/spatial/geometry/split/preview/{init.token}/AGRI_PARCEL/' + farmObjId,
            method: 'post',
            responseType: 'arraybuffer',
            data: JSON.stringify(factory.GeoJSON.fromLayer(lineLayer))
        })
            .then(response => {
                const geojson = factory.geoJSON(geobuf.decode(protobuf(response)), config.pathOptions);
                const stateData = store.getState().data.layers;

                geojson.getLayers().forEach(layer => {
                    const id = layer.feature.id
                    // remove old app layers entries, will update with the new geojson set.
                    stateData[id] && stateData[id].removeFrom(Map);
                })
                elements.alertUser(true,
                    'success',
                    'Успешно поделена просторна контрола',
                    'Добиени се ' + geojson.getLayers().length + ' нови парцели.',
                    getFarmMapAssets
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
                    getFarmMapAssets
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

    return <ProcessButton id={_id} onClick={enable} className={processID === _id ? 'active' : ''} >
        <Icon name={_id} size='28px' style={{ marginTop: '2px' }} />
        <span style={{ display: 'block', marginTop: '5px' }}>Подели парцела</span>
        {processID === _id
            && <Guidance id={_id}
                finish={() => polygon._finishShape()}
                undo={() => polygon._removeLastVertex()}
                disable={disable}
                msg={['', '']}
                title='Подели парцела' />}
    </ProcessButton>;
};

export const Split = core.connect(state => ({
    processID: state.app.processID, mapId: state.map.id, farmObjId: state.farmRegistry?.farmObjId
}))(_Split)
