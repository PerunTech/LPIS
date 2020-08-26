import { React, PropTypes, elements } from 'perun-core';
import { spatial } from '../../core';
import { PROCESS_ENUM, PB_STYLE, PB_STYLE_HOVER, DATA_CATEGORIES as dc } from '../../config';
import { BlockMetadata } from './BlockMetadata';

const {
    config: { MIN_DIGI_SCALE, MAP_CONFIG }, 
    core: { Map, store, factory, http, connect, geoJson },
    data: { protobuf, geobuf },
    tools: { edit },
    ui: { Button, Icon, DrawActions }} = spatial;

/**
 * Edit a physical block.
 */
export const editBlock = {
    _id: PROCESS_ENUM.editBlock,

    _layer: {},
    _layerGroup: factory.layerGroup(),


    enable () {
        this._layerGroup.addTo(Map);
        Map.setView(Map.getCenter(), MIN_DIGI_SCALE);
        store.dispatch({minZoom: MIN_DIGI_SCALE})
        this._fetchBlocks()
    },

    disable () {
        this._layer = {};
        this._layerGroup.clearLayers().removeFrom(Map);
        store.dispatch({processID: '', minZoom: MAP_CONFIG.minZoom});
        edit.polygon.disable();
    },

    onSubmit ({formData}) {
        http.call('save_pb', { 
            data: JSON.stringify({ 
                ...formData, 
                GEOM: factory.GeoJSON.fromLayer(this._layer, Map.getCRS()) 
            }),
            url: '/lpis/save/physicalBlock/{init.token}/' + this._layer.feature.id
        }).then(() => {
            store.dispatch({ 
                [dc.data_pb]: {
                    ...store.getState().data[dc.data_pb],
                    [this._genLayerId(this._layer)]: this._layer 
                },
                processID: this._id
            });
            this._layerGroup.removeLayer(this._layer);
            this._layer.addTo(Map);

            this.disable();
            elements.alertUser(true, 'success', 'Успешно зачувување', 'Физичкиот блок е запишан во базата на податоци.')
        }).catch(() => {
            this.disable();
            elements.alertUser(true, 'error', 'Грешка при зачувување', 'Физичкиот блок не е запишан во базата на податоци.');
        })
    },

    initEdit (layer) {
        // set fields, disable all selection events on group.
        this._layer = layer;
        this._layerGroup.eachLayer(layer => 
            layer.off('mouseover mouseout click'));

        // publish active process, edit begins.
        store.dispatch({ 
            [dc.data_pb]: {
                ...store.getState().data[dc.data_pb],
                [this._genLayerId(layer)]: layer 
            },
            processID: this._id
        });

        //Move map view on top of selected polygon.
        Map.fitBounds(layer.getBounds());

        // Activate edit handler on selected polygon
        edit.polygon.enable(this._simplifyMultipolygon(layer));

        // Activate edit event listeners on layer.
        layer.on('pm:edit', e => this._layer = e.target );
    },

    _fetchBlocks () {
        http.call('render_pb', {
            url: '/spatial/getGeometry/bbox/{init.token}/PHYSICAL_BLOCK/' + Map.getBBox(),
        }).then(response => {
            this._renderBlocks(geobuf.decode(protobuf(response)));
        }).catch(err => 
            console.log(err));
    },

    _renderBlocks (jsonArr) {
        jsonArr.features.map(el => {
            geoJson(el, {
                onEachFeature: function (feature, layer) {
                    this._setBlockEvents(layer);
                    this._layerGroup.addLayer(layer);
                }.bind(this),
            });
        })
    },

    _setBlockEvents (layer) {
        layer.on('mouseover', function () { this.setStyle(PB_STYLE_HOVER) })
            .on('mouseout', function () { this.setStyle(PB_STYLE) })
            .on('click', function () { editBlock.initEdit(this); })
    },

    _simplifyMultipolygon (layer) {
        let latlngArr = layer._latlngs
        let simpleLatlngArr = latlngArr[0];
        latlngArr.length = 0

        Object.keys(simpleLatlngArr).forEach(key => 
            latlngArr.push(simpleLatlngArr[key]));

        return layer;
    },

    _genLayerId (layer) {
        return String('Променет блок ' + layer._leaflet_id);
    },

    render: connect(state => ({ bbox: state.map.bbox })) (({processID, ...props}) => {
        // const [layer, setLayer] = useState({});
        const { _id, enable, disable, onSubmit, _layer } = editBlock;

        return <Button {...props}
            id={_id} 
            className={processID === _id ? 'active' : ''}
            onClick={enable.bind(editBlock)} >
                <Icon name={_id} size='30px' />
                <span style={{display: 'block', marginTop: '5px' }}>Промени физички блок</span>
                { processID === _id  
                    && <BlockMetadata onSubmit={onSubmit.bind(editBlock)} data={_layer.feature.properties} >
                        <DrawActions
                            cancel={disable.bind(editBlock)} />
                    </BlockMetadata> }
        </Button>;
    })       
}

editBlock.render.propTypes = {
    processID: PropTypes.string,
};
