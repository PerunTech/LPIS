import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../../Spatial';
import { Draw } from './Draw';
import { Create } from './Create';
import { Edit } from './Edit';
import { Split } from './Split';
import { Merge } from './Merge';
import { Cut } from './Cut';
import { Fill } from './Fill';
import { Delete } from './Delete';
import { Assign } from './Assign';
import { restAP } from './Config';

const { ButtonGroup, Divider } = ui

const _AgriParcel = ({processID}) => 
    <ButtonGroup>
        <Create processID={processID} />
        <Draw processID={processID} />
        <Edit processID={processID} />
        <Divider />
        <Split />
        <Merge />
        <Cut processID={processID} />
        <Fill processID={processID} />
        <Divider />
        <Assign />
        <Divider />
        <Delete processID={processID}/>
    </ButtonGroup>;

_AgriParcel.propTypes = {
    processID: PropTypes.string,
}

export const AgriParcel = core.connect(state => 
    ({ processID: state.app.processID }))(_AgriParcel);

core.store.addState('http', restAP);