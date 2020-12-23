import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../../Spatial';
import { AdvanceDigitization } from './Advance';
import { Draw } from './Draw';
import { Create } from './Create';
import { Delete } from './Delete';
import { Assign } from './Assign';
import { restAP } from './Config';

const { ButtonGroup, Button, Icon, Divider } = ui

const _AgriParcel = ({processID}) => 
    <ButtonGroup>
        <Create processID={processID} />
        <Draw processID={processID} />
        <Button disabled >
            <Icon name='editAP' size='28px' style={{marginTop: '4px'}} />
            <span style={{display: 'block', marginTop: '3px' }}>Промени парцела</span>
        </Button>
        <Divider />
        <AdvanceDigitization />
        <Divider />
        <Assign />
        <Divider />
        <Delete />
    </ButtonGroup>;

_AgriParcel.propTypes = {
    processID: PropTypes.string,
}

export const AgriParcel = core.connect(state => 
    ({ processID: state.app.processID }))(_AgriParcel);

core.store.addState('http', restAP);