import { React } from 'perun-core';
import { core, ui } from '../../../Spatial';
import { restCP } from './Config';
import { Create } from './Create';
import { Draw } from './Draw';
import { Edit } from './Edit';
import { Delete } from './Delete';
import { Refresh } from './Refresh';

const { connect } = core;
const { ButtonGroup, Divider } = ui

const _CropParcel = ({processID, farmerId, ...props}) =>
    <ButtonGroup>
        <Create {...props} processID={processID} farmerId={farmerId} />
        <Draw {...props} processID={processID} />
        <Edit {...props} processID={processID} farmerId={farmerId} />
        <Divider />
        <Refresh {...props} processID={processID} farmerId={farmerId} />
        <Divider />
        <Delete {...props} processID={processID} farmerId={farmerId} />
    </ButtonGroup>;

export const CropParcel = connect(state => 
    ({ processID: state.app.processID, farmerId: state.gsaa.farmerId }))(_CropParcel);

core.store.addState('http', restCP);