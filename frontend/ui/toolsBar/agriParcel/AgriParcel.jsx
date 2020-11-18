import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../../Spatial';
import { AdvanceDigitization } from './Advance';
import { createAP } from './Create';

const { ButtonGroup, Button, Icon, Divider } = ui

const _AgriParcel = ({processID}) => 
    <ButtonGroup>
        <createAP.render processID={processID} />
        <Button >
            <Icon name='editAP' size='30px' />
            <span style={{display: 'block', marginTop: '2px' }}>Промени земјоделска парцела</span>
        </Button>
        <Divider />
        <AdvanceDigitization name='земјоделска парцела' />
    </ButtonGroup>;

_AgriParcel.propTypes = {
    processID: PropTypes.string,
}

export const AgriParcel = core.connect(state => 
    ({ processID: state.app.processID }))(_AgriParcel);