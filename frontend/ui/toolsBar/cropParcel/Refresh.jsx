import { React, PropTypes, redux } from 'perun-core';
import { ui, core } from '../../../Spatial';
import { loadFarmerAssets } from '../..'

const { Button, Icon } = ui;
const _id = 'refreshCP';

/**
 * Create a crop parcel by selecting a single point.
 */
export const Refresh = ({ processID, farmerId }) => {
    return <Button id={_id} 
        onClick={() => {
            String(processID).length < 1
                && loadFarmerAssets(core.store.getState().gsaa.token, farmerId) 
        }} >
        <Icon name={_id} size='30px' />
        <span style={{display: 'block', marginTop: '2px' }}>Освежи парцели</span>
    </Button>;
};

Refresh.propTypes = {
    processID: PropTypes.string,
    farmerId: PropTypes.number
}
