import { React, PropTypes } from 'perun-core';
import { ui, core } from '../../../Spatial';
import { loadFarmerAssets } from '../..'
import { getFarmMapAssets } from '../../Util';

const { Button, Icon } = ui;
const _id = 'refreshCP';

/**
 * Create a crop parcel by selecting a single point.
 */
const _Refresh = ({ processID, mapId, farmerId }) => {
    const onClick = () => {
        if (mapId === 'farm-registry-map') {
            getFarmMapAssets()
        } else {
            loadFarmerAssets(core.store.getState().gsaa.token, farmerId, false, true)
        }
    }

    return <Button id={_id}
        onClick={() => {
            String(processID).length < 1
                && onClick()
        }} >
        <Icon name={_id} size='30px' />
        <span style={{ display: 'block', marginTop: '2px' }}>Освежи парцели</span>
    </Button>;
};

_Refresh.propTypes = {
    processID: PropTypes.string,
    farmerId: PropTypes.number
}

export const Refresh = core.connect(state => ({
    mapId: state.map.id
}))(_Refresh)
