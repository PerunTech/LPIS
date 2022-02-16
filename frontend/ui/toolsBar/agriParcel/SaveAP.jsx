import { React, ReactDOM, PropTypes, elements } from 'perun-core';
import { core, data, ui } from '../../../Spatial';
import { config } from './Config';

const { http, store, factory, Map, util } = core;
const { protobuf, geobuf } = data;
const { Button, Modal, Icon } = ui

export const saveAP = (layer, callback) => {
    // Container for our workflow.
    const container = document.getElementsByClassName('control-topleft')[0];

    // Exit operations on failed workflow.
    const _fail = (msg, desc) => {
        callback();
        elements.alertUser(true, 
            'error', 
            msg || 'Грешка при зачувување', 
            desc || 'Земјоделската парцела не е запишана во базата на податоци.');
    };

    // Resolution operations on successful workflow.
    const _succeed = data => {
        // Create layer from geojson, operate on the individual layer, rather than the feature collection.
        const geojson = factory.geoJSON(data, config.pathOptions);
        const stateData = store.getState().data.layers;


        geojson.getLayers().forEach(layer => {
            const id = layer.feature.id

            // remove old app layers entries, will update with the new geojson set.
            stateData[id] && stateData[id].removeFrom(Map);

            // Flatten the geometry array, so utilities can read the thing. god knows why this happens.
            layer.setLatLngs([ ...util.flattenDeep(layer.getLatLngs()) ])
            layer.addTo(Map);
        })
        callback();
        elements.alertUser(true, 
            'success', 
            'Успешно зачувување', 
            'Земјоделската парцела е запишана во базата на податоци.')
    };

    // Check 1, intersection with the underlining physical block.  
    const _checkPB = () =>  
        http.call('check_ap', { data: layer })
            .then(response =>
                response.data 
                    ? _checkAP(0) // if contained, continue to check 2
                    : ReactDOM.render(<PBModal />, container) // otherwise prompt user.
            ).catch(() => _fail());

    // Check 2, intersection with neigbouring agri parcels. 
    // Recalculates geometry based on check 1.
    const _checkAP = action => {
        // Unmount user prompt from check 1 manually
        ReactDOM.unmountComponentAtNode(container);

        // Make the call for check 2
        http.call('check_ap', { 
                data: layer,
                url: '/lpis/check/APIntersectsAP/{init.token}/' + (action === 0),
            }).then(response => 
                    response.data.check
                    ? ReactDOM.render(<APModal layer={response.data.layer} />, container)
                    : _saveAP(response.data.layer, 0)
            ).catch(() => _fail);
    };

    // Final step of the worklfow, saves agri parcel.
    // Recalculates geometry based on check 2, before the save.
    const _saveAP = (layer, action) => {
        // Unmount user prompt from check 2 manually
        ReactDOM.unmountComponentAtNode(container);

        const parentId = layer.PARENT_ID || 0
        // Make the call for the final save, with results from prompt 2.
        http.call('save_ap', { 
                data: JSON.stringify({ ...layer, GEOM: JSON.parse(layer.GEOM)}),
                url: '/lpis/save/agriParcel/{init.token}/' + layer.OBJECT_ID + '/' + parentId + '/' + action,
            })
            .then(response => _succeed(geobuf.decode(protobuf(response))))
            .catch(() => _fail());
    };

    // User input for the result of check 1
    const PBModal = () =>
        <Modal show id='pb-contains-ap-dialog' container={container} >
            <Modal.Title>
                <Icon name='warning' size='60px' />
                <span style={{display: 'block', marginTop: '10px' }}>Земјоделската парцела не е комплетно опфатена од еден и единствен физички блок</span>
            </Modal.Title>
            <Modal.Body >
                <Button block onClick={() => _checkAP(0)} >
                    <div>Задржи ја просторната определба</div>
                    <div>(системот ќе покрене барање за контрола на терен)</div>
                </Button>
                <Button block onClick={() => _checkAP(1)} >
                    Отсечи ја земјоделската парцела според границите на физичкиот блок
                </Button>
            </Modal.Body>
        </Modal>;
    
    // User input for the result of check 2.
    const APModal = ({layer}) =>
        <Modal show id='ap-ap-intersect-dialog' container={container} >
            <Modal.Title>
                <Icon name='warning' size='60px' />
                <span style={{display: 'block', marginTop: '10px' }}>Земјоделската парцела се пресекува со соседните земјоделски парцели</span>
            </Modal.Title>
            <Modal.Body >
                <Button block onClick={() => _saveAP(layer, 0)} >
                    <div>Задржи ја просторната определба</div>
                    <div>(системот ќе покрене барање за контрола на терен)</div>
                </Button>
                <Button block onClick={() => _saveAP(layer, 1)}>
                    Отсечи ја работната земјоделската парцела според границите на соседните земјоделски парцели
                </Button>
                <Button block onClick={() => _saveAP(layer, 2)}>
                    Отсечи ги соседните земјоделски парцели под лична сопственост, според границите на работната земјоделска парцела
                </Button>
            </Modal.Body>
        </Modal>;
    APModal.propTypes = {
        layer: PropTypes.obj
    };

    // Begin workflow
    // intentional dispatch, disables form on screen, workflow is atomic (will either fail or succeed)
    store.dispatch({processID: ''}); 
    _checkPB();
}