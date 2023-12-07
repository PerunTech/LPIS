import { React, PropTypes } from 'perun-core';
import { ui } from '../../../Spatial';
import { getFarmPPlanAssets, getLabel } from '../../Util';

const { Button, Icon } = ui;
const _id = 'refreshCP';

export const Refresh = ({ processID }) => {
    const onClick = () => {
        getFarmPPlanAssets(true)
    }

    return (
        <Button id={_id}
            onClick={() => {
                String(processID).length < 1
                    && onClick()
            }} >
            <Icon name={_id} size='30px' />
            <span style={{ display: 'block', marginTop: '2px' }}>{getLabel('refresh')}</span>
        </Button>
    );
};

_Refresh.propTypes = {
    processID: PropTypes.string,
}
