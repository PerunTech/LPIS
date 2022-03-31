import { React, ReactDOM, PropTypes, elements } from 'perun-core';
import { core, data, ui } from '../../../Spatial';
import { config } from './Config';
import { strcmp } from '../../Util'

const { http, store, factory, Map, util } = core;
const { protobuf, geobuf } = data;
const { Button, Modal, Icon } = ui

export const saveAP = (layer, callback) => {
    // Container for our workflow.
    const container = document.getElementsByClassName('control-topleft')[0];

    // Exit operations on failed workflow.
    const _fail = (msg, desc) => {
        callback();
        store.dispatch({ saveIsPending: false })
        elements.alertUser(true,
            'error',
            msg || 'Грешка при зачувување',
            desc || 'Земјоделската парцела не е запишана во базата на податоци.');
    };

    // Resolution operations on successful workflow.
    const _succeed = (data, layer) => {
        // Create layer from geojson, operate on the individual layer, rather than the feature collection.
        const geojson = factory.geoJSON(data, config.pathOptions);
        const stateData = store.getState().data.layers;
        geojson.getLayers().forEach(layer => {
            const id = layer.feature.id
            // remove old app layers entries, will update with the new geojson set.
            stateData[id] && stateData[id].removeFrom(Map);
            // Flatten the geometry array, so utilities can read the thing. god knows why this happens.
            layer.setLatLngs([...util.flattenDeep(layer.getLatLngs())])
            layer.addTo(Map);
        })
        store.dispatch({ saveIsPending: false })
        elements.alertUser(true,
            'success',
            'Успешно зачувување',
            'Земјоделската парцела е запишана во базата на податоци.', () => callback(layer, geojson.getLayers()))
    };

    // Check 1, intersection with the underlining physical block.  
    const _checkPB = () => {
        http.call('check_ap', { data: layer }).then(response => {
            const resType = response.data?.type
            if (strcmp(resType, 'success')) {
                // The parcel is contained within a physical block
                _checkAP(0)
            } else if (strcmp(resType, 'warning')) {
                // The parcel is partially contained with a physical block
                ReactDOM.render(<PBModal />, container)
            } else {
                // The parcel is not contained within a physical block
                const title = 'Парцелата не се наоѓа во границите на ниту еден физички блок'
                elements.alertUser(true, 'error', title, '', () => callback());
            }
        }).catch(() => _fail());
    }

    const _cutoffAPaccordingToPB = () => {
        http.call('cutoff_ap', {
            url: '/lpis/cutoff/physicalBlock/{init.token}',
            data: layer,
            method: 'post',
            responseType: 'arraybuffer'
        }).then(response => {
            const data = geobuf.decode(protobuf(response));
            const geojson = factory.geoJSON(data, config.pathOptions);
            const layers = geojson.getLayers();
            layers.forEach(layer => {
                layer.feature.id = 0
                layer.addTo(Map);
                _checkAP(0, layer)
            })
        }).catch(() => {
            // Unmount user prompt from check 1 manually
            ReactDOM.unmountComponentAtNode(container);
            _fail()
        })
    }

    // Check 2, intersection with neigbouring agri parcels.
    // Recalculates geometry based on check 1.
    const _checkAP = (action, cutoffLayer) => {
        // Unmount user prompt from check 1 manually
        ReactDOM.unmountComponentAtNode(container);
        const finalData = JSON.parse(layer)
        // If the layer was cutoff in the previous check, use that one, else, use the initial drawn (or edited) one
        if (cutoffLayer) {
            Reflect.set(finalData, 'GEOM', factory.GeoJSON.fromLayer(cutoffLayer))
        }
        // Make the call for check 2
        http.call('check_ap', {
            data: JSON.stringify(finalData),
            url: '/lpis/check/APIntersectsAP/{init.token}/' + (action === 0),
        }).then(response => {
            if (response.data?.check) {
                ReactDOM.render(<APModal layer={finalData} />, container)
            } else {
                _saveAP(finalData, 'IGNORE')
            }
        }).catch(() => _fail);
    };

    // Final step of the worklfow, saves agri parcel.
    // Recalculates geometry based on check 2, before the save.
    const _saveAP = (layer, action) => {
        store.dispatch({ saveIsPending: true })
        // Unmount user prompt from check 2 manually
        ReactDOM.unmountComponentAtNode(container);
        const parentId = layer.PARENT_ID || layer.parent_id || 0
        // Make the call for the final save, with results from prompt 2.
        http.call('save_ap', {
            data: JSON.stringify(layer),
            url: '/lpis/save/agriParcel/{init.token}/' + layer.OBJECT_ID + '/' + parentId + '/' + action,
        })
            .then(response => _succeed(geobuf.decode(protobuf(response)), layer))
            .catch(() => _fail());
    };

    // User input for the result of check 1
    const PBModal = () =>
        <Modal show id='pb-contains-ap-dialog' container={container} >
            <Modal.Title>
                <Icon name='warning' size='60px' />
                <span style={{ display: 'block', marginTop: '10px' }}>Земјоделската парцела не е комплетно опфатена од еден и единствен физички блок</span>
            </Modal.Title>
            <Modal.Body >
                <Button block onClick={() => _checkAP(0)} >
                    <div>Задржи ја просторната определба</div>
                    <div>(системот ќе покрене барање за контрола на терен)</div>
                </Button>
                <Button block onClick={() => _cutoffAPaccordingToPB(1)} >
                    Отсечи ја земјоделската парцела според границите на физичкиот блок
                </Button>
            </Modal.Body>
        </Modal>;

    // User input for the result of check 2.
    const APModal = ({ layer }) =>
        <Modal show id='ap-ap-intersect-dialog' container={container} >
            <Modal.Title>
                <Icon name='warning' size='60px' />
                <span style={{ display: 'block', marginTop: '10px' }}>Земјоделската парцела се пресекува со соседните земјоделски парцели</span>
            </Modal.Title>
            <Modal.Body >
                <Button block onClick={() => _saveAP(layer, 'IGNORE')} >
                    <div>Задржи ја просторната определба</div>
                    <div>(системот ќе покрене барање за контрола на терен)</div>
                </Button>
                <Button block onClick={() => _saveAP(layer, 'CUTOFF')}>
                    Отсечи ја работната земјоделската парцела според границите на соседните земјоделски парцели
                </Button>
                {/* <Button block onClick={() => _saveAP(layer, 2)}>
                    Отсечи ги соседните земјоделски парцели под лична сопственост, според границите на работната земјоделска парцела
                </Button> */}
            </Modal.Body>
        </Modal>;
    APModal.propTypes = {
        layer: PropTypes.object
    };

    // Begin workflow
    // intentional dispatch, disables form on screen, workflow is atomic (will either fail or succeed)
    store.dispatch({ processID: '' });
    _checkPB();
}