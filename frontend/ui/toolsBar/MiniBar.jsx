import { React } from 'perun-core';
import { core } from '../../Spatial';
import { CropParcel } from '..';

const _MiniBar = ({processID}) => 
    <div id='minibar'   >
        <CropParcel processID={processID} />
    </div>;

export const MiniBar = core.connect(state => 
    ({ processID: state.app.processID }))(_MiniBar);