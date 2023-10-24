import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../Spatial';
import { getCropLabel } from '..'
import { getLabel, getMeasurementUnit, strcmp, translateBooleanValue } from '../Util';

const { factory, Map, store } = core;
const { ButtonGroup, Button, Icon } = ui;

const { useState, useEffect } = React;

let hiddenAssets = [];

const getParcelVisibleIcon = (id, type) => {
    let iconName = 'eye-on';
    let layers = store.getState()?.farmRegistry?.agriParcels;
    if (strcmp(type, 'land_use_plan')) {
        layers = store.getState()?.farmRegistry?.farmPPlanData;
    } else if (strcmp(type, 'physical_block')) {
        layers = store.getState()?.lpis?.loadedPhysicalBlocks;
    }
    Object.values(layers).forEach((l) => {
        if (Number(l.getId()) === Number(id)) {
            if (l.options.fillOpacity == 0) {
                iconName = 'eye-light';
            }
        }
    });
    for (let i = 0; i < hiddenAssets.length; i++) {
        if (Number(hiddenAssets[i].getId()) === Number(id)) {
            iconName = 'eye-off';
        }
    }
    return iconName;
};

const toggleAssetFromMap = (id, type) => {
    let layers = store.getState()?.farmRegistry?.agriParcels;
    if (strcmp(type, 'land_use_plan')) {
        layers = store.getState()?.farmRegistry?.farmPPlanData;
    } else if (strcmp(type, 'physical_block')) {
        layers = store.getState()?.lpis?.loadedPhysicalBlocks;
    }
    let visible = true;
    Object.values(layers).forEach((l) => {
        if (Number(l.getId()) === Number(id)) {
            if (l._map && l.options.fillOpacity === 0.0) {
                l.removeFrom(Map);
                hiddenAssets.push(l);
                visible = false;
            } else {
                l.setStyle({ fillOpacity: 0 });
            }
        }
    });
    if (visible) {
        for (let i = 0; i < hiddenAssets.length; i++) {
            if (Number(hiddenAssets[i].getId()) === Number(id)) {
                hiddenAssets[i].setStyle({ fillOpacity: 0.25 });
                hiddenAssets[i].addTo(Map);
                hiddenAssets.splice(i, 1);
            }
        }
    }
    return visible;
};

const removeLayer = (id, type) => {
    let layers = {}
    if (strcmp(type, 'physical_block')) {
        layers = store.getState()?.lpis?.loadedPhysicalBlocks;
        Object.values(layers).forEach(loadedLayer => {
            if (strcmp(loadedLayer.feature.id, id)) {
                // Remove the loaded layer from the map & from the loadedPhysicalBlocks object
                loadedLayer.removeFrom(Map)
                Reflect.deleteProperty(layers, id)
            }
        })

        if (Object.keys(layers).length === 0) {
            store.dispatch({ loadedPhysicalBlocks: {}, physicalBlocksHaveBeenLoaded: false })
        }
    }
}

const _DataGrid = ({ type, rows, selectedParcelId, selectedCropParcelId }) => {
    return store.getState().map.id === 'gsaa-map'
        ? <div id={type.id + '-grid'} className='data-grid' >
            <_GSAAHeader typeId={type.id} />
            {rows.length > 0 ? <_GSAARows rows={rows} /> : <_NoData />}
        </div>
        : <div id={type.id + '-grid'} className='data-grid' >
            <_GridHeader typeId={type.id} />
            {rows.length > 0 ? <_GridRows rows={rows} selectedParcelId={selectedParcelId} selectedCropParcelId={selectedCropParcelId} /> : <_NoData />}
        </div>
}

_DataGrid.propTypes = {
    type: PropTypes.object,
    rows: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.array
    ]),
}

export const DataGrid = core.connect(state => ({
    selectedParcelId: state.farmRegistry?.selectedParcelId, selectedCropParcelId: state.farmRegistry?.selectedCropParcelId
}))(_DataGrid)

/* --------------------- */
/*      GRID HEADER      */
/* --------------------- */
const columnEnum = {
    physical_block: [`${getLabel('lpis_number')}`, `${getLabel('class')}`, `${getLabel('area')}`, '', '', ''],
    agri_parcel: [`${getLabel('lpis_number')}`, `${getLabel('area')}`, `${getLabel('land_use_code')}`, `${getLabel('locality')}`, , `${getLabel('common_use')}`, `${getLabel('right_of_use')}`],
    land_use_plan: [`${getLabel('lpis_number')}`, `${getLabel('cultivation')}`, `${getLabel('area')}`, `${getLabel('num_of_crops')}`],
    cad_parcel: ['Ид. Број', 'Број на КО', `${getLabel('area')}`],
    measurements: ['Ид. Број', 'Тип', 'Мерење'],
    imports: ['Ид. Број', 'Тип', `${getLabel('area')}`],
    pastures: ['Ид. Број', `${getLabel('locality')}`, `${getLabel('area')}`],
    landscape_features: ['Ид. Број', 'Број на ЗП', `${getLabel('area')}`],
    npa: ['Ид. Број', 'Назив', `${getLabel('area')}`],
    soil_types: ['Ид. Број', 'Тип', `${getLabel('area')}`],
    transport_network: ['Ид. Број', 'Назив', 'Должина'],
    water_bodies: ['Ид. Број', 'Назив', 'Должина'],
    resto: ['Ид. Број', 'Тип', `${getLabel('area')}`]
};

/* Column names above each set of data types in the list. */
const _GridHeader = ({ typeId }) => {
    const columns = columnEnum[typeId] || columnEnum['resto'];
    const columnElements = columns.map((el, i) => {
        const key = strcmp(typeId, 'physical_block') ? `${el}_${i + 1}` : el
        let classNames = 'data-grid-column'
        if (strcmp(typeId, 'physical_block')) {
            // This will get only the elements that do not contain any text
            if (!el) {
                classNames += ' data-grid-column-pb-util'
            }
        }
        return <Button key={key} disabled className={classNames} >{el}</Button>
    })
    return <ButtonGroup className='data-grid-header' id="grid-header">
        <Button disabled className='data-grid-index' />
        {columnElements}
        <Button disabled style={{ width: '60px' }} />
    </ButtonGroup>
}

_GridHeader.propTypes = {
    typeId: PropTypes.string
}

/* ------------------------------ */
/*      GENERIC GRID CONTENT      */
/* ------------------------------ */
const _GridRows = ({ rows, selectedParcelId, selectedCropParcelId }) => {
    const [isOpen, setOpen] = useState(true);
    const [selectedParcelRowId, selectParcelRow] = useState('');
    const [selectedCropParcelRowId, selectCropParcelRow] = useState('');

    useEffect(() => {
        if (selectedParcelId) {
            handleParcelRowSelection(selectedParcelId)
        } else {
            selectParcelRow('')
        }
    }, [selectedParcelId])

    useEffect(() => {
        if (selectedCropParcelId) {
            handleCropParcelRowSelection(selectedCropParcelId)
        } else {
            selectCropParcelRow('')
        }
    }, [selectedCropParcelId])

    const handleParcelRowSelection = id => {
        if (selectedParcelRowId !== id) {
            selectParcelRow(id)
        } else {
            selectParcelRow('')
            store.dispatch({ selectedParcelId: '' })
        }
    }

    const handleCropParcelRowSelection = id => {
        if (selectedCropParcelRowId !== id) {
            selectCropParcelRow(id)
        } else {
            selectCropParcelRow('')
            store.dispatch({ selectedCropParcelId: '' })
        }
    }

    const toggleAssetFromMapAction = (el, type) => {
        toggleAssetFromMap(el.getId(), type);
        setOpen(!isOpen);
    }

    return rows.map((el) => {
        const props = el.feature && el.feature.properties;
        const descriptor = props.DESCRIPTOR

        if (strcmp(descriptor, 'agri_parcel')) {
            const id = props.OLD_ID || el.getId(),
                objectId = el.getId(),
                measurement = Math.round(el.getMeasurement()),
                landClass = props.LAND_COVER_CODE,
                name = props.HOME_NAME || el.getName(),
                unit = el instanceof factory.Polygon ? 'm²' : 'm',
                commonUse = props.COMMON_USE,
                certificateOfUse = props.CERTIFICATE_OF_USE;

            let rowClassNames = ['data-grid-row']
            if (selectedParcelRowId === objectId) {
                rowClassNames.push(' data-grid-row-focused')
            }

            return <ButtonGroup className={rowClassNames.join('')} key={id} id={objectId}>
                <Button disabled className='data-grid-index' />
                <Button disabled className='data-grid-column' >{id}</Button>
                <Button disabled className='data-grid-column' >{measurement + ' ' + unit}</Button>
                <Button disabled className='data-grid-column' >{landClass}</Button>
                <Button disabled className='data-grid-column' >{name}</Button>
                <Button disabled className='data-grid-column'>{translateBooleanValue(commonUse)}</Button>
                <Button disabled className='data-grid-column'>{translateBooleanValue(certificateOfUse)}</Button>
                <Button className='data-grid-util' onClick={() => Map.fitBounds(el.getBounds())} >
                    <Icon name='pinpoint-secondary' size='16px' />
                </Button>
                <Button className='data-grid-util' onClick={() => toggleAssetFromMapAction(el, descriptor)}>
                    <Icon name={getParcelVisibleIcon(el.getId(), descriptor)} size='16px' />
                </Button>
            </ButtonGroup>
        } else if (strcmp(descriptor, 'land_use_plan')) {
            if (props.AGRI_PARCEL_ID === undefined) return null;
            const id = getAgriNum(props.AGRI_PARCEL_ID, true),
                objectId = el.getId(),
                code = getCropLabel(props.CROP_CODE),
                measurement = Math.round(props.AREA),
                unit = getMeasurementUnit(true),
                nPlants = props.NUMBER_PLANTS;

            let rowClassNames = ['data-grid-row']
            if (selectedCropParcelRowId === objectId) {
                rowClassNames.push(' data-grid-row-focused')
            }

            return <ButtonGroup className={rowClassNames.join('')} key={id + measurement} >
                <Button disabled className='data-grid-index' />
                <Button disabled className='data-grid-column' >{id}</Button>
                <Button disabled className='data-grid-column' >{code}</Button>
                <Button disabled className='data-grid-column' >{measurement + ' ' + unit}</Button>
                <Button disabled className='data-grid-column' >{nPlants}</Button>
                <Button className='data-grid-util' onClick={() => Map.fitBounds(el.getBounds())} >
                    <Icon name='pinpoint-secondary' size='16px' />
                </Button>
                <Button className='data-grid-util' onClick={() => {
                    toggleAssetFromMap(el.getId(), descriptor)
                    setOpen(!isOpen)
                }}>
                    <Icon name={getParcelVisibleIcon(el.getId(), descriptor)} size='16px' />
                </Button>
            </ButtonGroup>
        } else if (strcmp(descriptor, 'physical_block')) {
            const id = props.OLD_ID || '/',
                objectId = el.getId(),
                landCoverCode = props.LAND_COVER_CODE,
                area = Math.round(props.AREA),
                unit = getMeasurementUnit(true)
            return <ButtonGroup className='data-grid-row data-grid-row-pb' key={objectId} >
                <Button disabled className='data-grid-index' />
                <Button disabled className='data-grid-column' >{id}</Button>
                <Button disabled className='data-grid-column' >{landCoverCode}</Button>
                <Button disabled className='data-grid-column' >{area + ' ' + unit}</Button>
                <Button className='data-grid-util' onClick={() => Map.fitBounds(el.getBounds())} >
                    <Icon name='pinpoint-secondary' size='16px' />
                </Button>
                <Button className='data-grid-util' onClick={() => {
                    toggleAssetFromMap(objectId, descriptor)
                    setOpen(!isOpen)
                }}>
                    <Icon name={getParcelVisibleIcon(objectId, descriptor)} size='16px' />
                </Button>
                <Button title='Отстрани од мапа' className='data-grid-util' onClick={() => removeLayer(objectId, descriptor)} >
                    <Icon name='cancel' size='16px' />
                </Button>
            </ButtonGroup>
        }
    });
}

/* ----------------------------- */
/*      NO DATA FOUND            */
/* ----------------------------- */
const _NoData = () =>
    <div className='data-grid-empty-rows' >
        <ButtonGroup >
            <Button disabled style={{ opacity: 1 }}>
                <Icon name='empty-grid' size='18px' />
            </Button>
            <Button disabled >{getLabel('no_data_found')}</Button>
        </ButtonGroup>
    </div>

/* --------------------------- */
/*      GSAA GRID CONTENT      */
/* --------------------------- */
/* ---------------- */
/*      HEADER      */
/* ---------------- */
const gsaaColEnum = {
    agri_parcel: ['СИЗП Број', 'Површина', 'Употреба на земјиште', 'Локалитет'],
    land_use_plan: ['СИЗП Број', 'Земјоделска култура', 'Површина', 'Број на насади'],
};

/* Column names above each set of data types in the list. */
const _GSAAHeader = ({ typeId }) => {
    const columns = gsaaColEnum[typeId];

    return columns.length > 0
        && <ButtonGroup className='data-grid-header' id="grid-header">
            <Button disabled className='data-grid-index' />
            <Button disabled className='data-grid-column' >{columns[0]}</Button>
            <Button disabled className='data-grid-column' >{columns[1]}</Button>
            <Button disabled className='data-grid-column' >{columns[2]}</Button>
            <Button disabled className='data-grid-column' >{columns[3]}</Button>
            <Button disabled style={{ width: '20px' }} />
        </ButtonGroup>
}

_GSAAHeader.propTypes = {
    typeId: PropTypes.string
}
/* -------------- */
/*      ROWS      */
/* ---------- --- */
const _GSAARows = ({ rows }) => {
    return rows.map((el) => {
        const props = el.feature && el.feature.properties;

        if (!props) return null; // exit on temp items, we don't show these.

        if (el.getMetadata().type === 'agri_parcel') {
            const id = props.OLD_ID,
                measurement = Math.round(props.ALLOWED_AREA),
                landClass = props.LAND_COVER_CODE,
                loc = props.HOME_NAME,
                unit = 'm²';

            // Connect and filter when id || name || measurement matches search string. Thats our search list filter.
            return <ButtonGroup className='data-grid-row' key={id} >
                <Button disabled className='data-grid-index' />
                <Button disabled className='data-grid-column' >{id}</Button>
                <Button disabled className='data-grid-column' >{measurement + ' ' + unit}</Button>
                <Button disabled className='data-grid-column' >{landClass}</Button>
                <Button disabled className='data-grid-column' >{loc}</Button>
                <Button className='data-grid-util' onClick={() => Map.fitBounds(el.getBounds())} >
                    <Icon name='gsaa-pinpoint' size='16px' />
                </Button>
            </ButtonGroup>
        } else {
            if (props.AGRI_PARCEL_ID === undefined) return null; // if crop parcel is not a db row, exit.

            const id = getAgriNum(props.AGRI_PARCEL_ID),
                code = getCropLabel(props.CROP_CODE), // crop_codes_desc[crop_codes_idx.findIndex(val => val === props.CROP_CODE)],
                measurement = Math.round(props.AREA),
                unit = getMeasurementUnit(true),
                nPlants = props.NUMBER_PLANTS;

            return <ButtonGroup className='data-grid-row' key={id + measurement} >
                <Button disabled className='data-grid-index' />
                <Button disabled className='data-grid-column' >{id}</Button>
                <Button disabled className='data-grid-column' >{code}</Button>
                <Button disabled className='data-grid-column' >{measurement + ' ' + unit}</Button>
                <Button disabled className='data-grid-column' >{nPlants}</Button>
                <Button className='data-grid-util' onClick={() => Map.fitBounds(el.getBounds())} >
                    <Icon name='gsaa-pinpoint' size='16px' />
                </Button>
            </ButtonGroup>
        }
    });
}

const getAgriNum = (id, isPPlan) => {
    let layers = Object.values(store.getState().data.layers);
    if (isPPlan) {
        layers = store.getState().farmRegistry?.agriParcels
    }
    const parcelArr = layers.filter(el => el.feature && el.feature.id && Number(el.feature.id) === Number(id));

    return parcelArr.length > 0
        ? parcelArr[0].feature.properties.OLD_ID
        : 0;
}