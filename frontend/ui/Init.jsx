import { React, redux, Loading } from 'perun-core';
import { ui, core, config } from '../Spatial';
import { ToolsBar, MiniBar, DataPanel, LayerPanel, StatusBar, readCookie, loadFarmerAssets } from '.';
import { getFarmMapAssets, getCropCodes, getDbCRS, getGeoTypeLayers, getLandCoverCodes, getLayers } from './Util';

const { SYS_CENTER } = config;
const { Map, store } = core;
const { useState, useEffect } = React;

const GsaaMap = () => {
    const [mapElement, setMapElement] = useState(null);

    useEffect(() => {
        const _token = readCookie('token');
        const _farmerId = Number(readCookie('farmerObj'));
        // const _token = redux.store.getState().security.svSession;
        // const _farmerId = 457156934 // 34956 242466 457156934

        // add check for token, farmerId existance and validate.
        // exit properly for the user on fail.

        core.store.addState('gsaa', { farmerId: _farmerId, token: _token });
        loadFarmerAssets(_token, _farmerId, true);

        setMapElement(ui.init(_token)
            .addControl(MiniBar, {}, { position: 'topleft' })
            .addControl(DataPanel, {
                categories: [
                    { id: 'agri_parcel', label: 'Земјоделски парцели', isOpen: true },
                    { id: 'land_use_plan', label: 'Производни парцели', isOpen: true }
                ]
            }, { position: 'left' })
            .addControl(LayerPanel, {}, { position: 'right' })
            .addControl(StatusBar, {}, { position: 'bottom', className: 'status-bar' })
            .withNavigationControl()
            .withWindRose()
            .render('gsaa-map'));
    }, []);

    return mapElement;
}

export const gsaa = () => <GsaaMap />;

const LpisMap = () => {
    const [mapElement, setMapElement] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const token = redux.store.getState().security.svSession;

        store.addState('lpis', {
            'physicalBlocksHaveBeenLoaded': false, 'loadedPhysicalBlocks': {},
            'systemLayers': {}, 'systemLayersFull': {},
            'farmSearchFormData': {}, 'farmSearchData': undefined
        })

        const layersToRemove = [];
        Map.eachLayer(function (layer) {
            layersToRemove.push(layer);
        });
        layersToRemove.forEach(layer => Map.removeLayer(layer));

        Promise.all([
            getLandCoverCodes(),
            getCropCodes(),
            getGeoTypeLayers(),
            getLayers(),
            getDbCRS()
        ]).then(() => {
            if (cancelled) return;
            const layers = store.getState().listOfLayers

            Map.setView(SYS_CENTER, 3);

            setMapElement(ui.init(token)
                .addControl(ToolsBar, {}, { position: 'top' })
                .addControl(DataPanel, {}, { position: 'left' })
                .addControl(LayerPanel, {}, { position: 'right' })
                .addControl(StatusBar, {}, { position: 'bottom', className: 'status-bar' })
                .withNavigationControl()
                .addRasterLayers(layers?.[0] || {}, layers?.[1] || {}, { collapsed: false, position: 'right' })
                .withWindRose()
                .render('lpis-map'));
        })

        return () => { cancelled = true; };
    }, []);

    return mapElement || <Loading />;
}

export const lpis = () => <LpisMap />;

const FarmRegLpisMap = ({ showHeaderAndFooter }) => {
    const [mapElement, setMapElement] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const token = redux.store.getState().security.svSession;

        store.addState('farmRegistry', {
            'agriParcels': {}, 'cadIntersections': {}, 'farmPPlanData': {}, 'farmObjId': '', 'farmObjTypeId': '', 'actionType': '',
            'fic': '', 'fullName': '', 'tableName': '', 'selectedParcelId': '', 'selectedCropParcelId': '', 'saveIsPending': false,
            'showCadParcels': false, 'hiddenAssets': [], 'parcelHistory': [], 'theSearchedParcelWasRemoved': false, 'parcelsHaveBeenLoaded': false,
            'showParcelInfoContainer': false, 'farmInfo': undefined, 'parcelInfo': undefined, 'historyEditEnabled': false, 'historyParcelToEdit': {},
            'editFormWasClosed': false, 'parcelHistoryModalWasClosed': false, 'digitizationIsActive': false, 'canRenderTheDigitizationButton': false,
            'activateInfoProcess': false, 'controlResults': [], 'showControlResultsContainer': false, 'hiddenControlResultAssets': [],
            'controlResultEditEnabled': false, 'copiedControlResultGeometry': {}, 'agriParcelsWithControlResultGeometries': [], 'activeTab': '',
            'weAreRenderingDirectly': showHeaderAndFooter ? true : false
        })

        getFarmMapAssets(true)

        Promise.all([
            getLandCoverCodes(),
            getCropCodes(),
            getGeoTypeLayers(),
            getLayers(),
            getDbCRS()
        ]).then(() => {
            if (cancelled) return;
            const layers = store.getState().listOfLayers

            const mapId = showHeaderAndFooter ? 'farm-registry-map-inline' : 'farm-registry-map'

            setMapElement(ui.init(token)
                .addControl(ToolsBar, {}, { position: 'top' })
                .addControl(DataPanel, {}, { position: 'left' })
                .addControl(LayerPanel, {}, { position: 'right' })
                .addControl(StatusBar, {}, { position: 'bottom', className: 'status-bar' })
                .withNavigationControl()
                .addRasterLayers(layers?.[0] || {}, layers?.[1] || {}, { collapsed: false, position: 'right' })
                .withWindRose()
                .render(mapId, showHeaderAndFooter || false));
        })

        return () => { cancelled = true; };
    }, [showHeaderAndFooter]);

    return mapElement || <Loading />;
}

export const farmRegLpis = (props) => <FarmRegLpisMap showHeaderAndFooter={props?.showHeaderAndFooter} />;
