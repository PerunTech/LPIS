import { React, redux, Loading } from 'perun-core';
import { ui, core, config } from '../Spatial';
import { ToolsBar, MiniBar, DataPanel, LayerPanel, StatusBar, readCookie, loadFarmerAssets } from '.';
import { getFarmMapAssets, getCropCodes, getDbCRS, getGeoTypeLayers, getLandCoverCodes, getLayers } from './Util';

const { SYS_CENTER } = config;
const { Map, store } = core;

let _isLoaded = false;
const _gsaa = (_token) => {
    // Prevent multiple initializations.
    return !_isLoaded
        ? (_isLoaded = true, ui.init(_token)
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
            .render('gsaa-map'))
        : null
}

export const gsaa = () => {
    const _token = readCookie('token');
    const _farmerId = Number(readCookie('farmerObj'));
    // const _token = redux.store.getState().security.svSession;
    // const _farmerId = 457156934 // 34956 242466 457156934

    // add check for token, farmerId existance and validate.
    // exit properly for the user on fail.

    core.store.addState('gsaa', { farmerId: _farmerId, token: _token });
    loadFarmerAssets(_token, _farmerId, true);

    return _gsaa(_token);
}

class LpisMap extends React.Component {
    constructor(props) {
        super(props)
        this.state = { loading: true, mapElement: null }
    }

    componentDidMount() {
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
            const layers = store.getState().listOfLayers

            Map.setView(SYS_CENTER, 3);

            const map = ui.init(this.props.token)
                .addControl(ToolsBar, {}, { position: 'top' })
                .addControl(DataPanel, {}, { position: 'left' })
                .addControl(LayerPanel, {}, { position: 'right' })
                .addControl(StatusBar, {}, { position: 'bottom', className: 'status-bar' })
                .withNavigationControl()
                .addRasterLayers(layers?.[0] || {}, layers?.[1] || {}, { collapsed: false, position: 'right' })
                .withWindRose()
                .render('lpis-map');

            this.setState({ loading: false, mapElement: map })
        })
    }

    render() {
        if (this.state.loading) return <Loading />
        return this.state.mapElement
    }
}

export const lpis = () => {
    const _token = redux.store.getState().security.svSession;
    return <LpisMap token={_token} />
}

class FarmRegLpisMap extends React.Component {
    constructor(props) {
        super(props)
        this.state = { loading: true, mapElement: null }
    }

    componentDidMount() {
        store.addState('farmRegistry', {
            'agriParcels': {}, 'cadIntersections': {}, 'farmPPlanData': {}, 'farmObjId': '', 'farmObjTypeId': '', 'actionType': '',
            'fic': '', 'fullName': '', 'tableName': '', 'selectedParcelId': '', 'selectedCropParcelId': '', 'saveIsPending': false,
            'showCadParcels': false, 'hiddenAssets': [], 'parcelHistory': [], 'theSearchedParcelWasRemoved': false, 'parcelsHaveBeenLoaded': false,
            'showParcelInfoContainer': false, 'farmInfo': undefined, 'parcelInfo': undefined, 'historyEditEnabled': false, 'historyParcelToEdit': {},
            'editFormWasClosed': false, 'parcelHistoryModalWasClosed': false, 'digitizationIsActive': false, 'canRenderTheDigitizationButton': false,
            'activateInfoProcess': false, 'controlResults': [], 'showControlResultsContainer': false, 'hiddenControlResultAssets': [],
            'controlResultEditEnabled': false, 'copiedControlResultGeometry': {}, 'agriParcelsWithControlResultGeometries': [], 'activeTab': '',
            'weAreRenderingDirectly': this.props.showHeaderAndFooter ? true : false
        })

        getFarmMapAssets(true)

        Promise.all([
            getLandCoverCodes(),
            getCropCodes(),
            getGeoTypeLayers(),
            getLayers(),
            getDbCRS()
        ]).then(() => {
            const layers = store.getState().listOfLayers

            const mapId = this.props.showHeaderAndFooter ? 'farm-registry-map-inline' : 'farm-registry-map'

            const map = ui.init(this.props.token)
                .addControl(ToolsBar, {}, { position: 'top' })
                .addControl(DataPanel, {}, { position: 'left' })
                .addControl(LayerPanel, {}, { position: 'right' })
                .addControl(StatusBar, {}, { position: 'bottom', className: 'status-bar' })
                .withNavigationControl()
                .addRasterLayers(layers?.[0] || {}, layers?.[1] || {}, { collapsed: false, position: 'right' })
                .withWindRose()
                .render(mapId, this.props.showHeaderAndFooter || false);

            this.setState({ loading: false, mapElement: map })
        })
    }

    render() {
        if (this.state.loading) return <Loading />
        return this.state.mapElement
    }
}

export const farmRegLpis = (props) => {
    const _token = redux.store.getState().security.svSession;
    return <FarmRegLpisMap token={_token} showHeaderAndFooter={props?.showHeaderAndFooter} />
}
