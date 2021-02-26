import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../../Spatial';
import { Create } from './Create';
import { Draw } from './Draw';
import { Edit } from './Edit';
import { Delete } from './Delete';

const { connect } = core;
const { ButtonGroup, Divider } = ui

const _CropParcel = ({processID, ...props}) => 
    <ButtonGroup>
        <Create {...props} processID={processID} />
        <Draw {...props} processID={processID} />
        <Edit {...props} processID={processID} />
        <Divider />
        <Delete {...props} processID={processID} />
    </ButtonGroup>;

_CropParcel.propTypes = {
    processID: PropTypes.string,
}

export const CropParcel = connect(state => 
    ({ processID: state.app.processID }))(_CropParcel);