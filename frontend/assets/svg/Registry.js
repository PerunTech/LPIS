import { React } from 'perun-core';
import { spatial } from '../../core';

const { assets } = spatial;

export const _registry = {
    'cut-parcel': {
        version: '1.1',
        x: '0px',
        y: '0px',
        viewBox: '0 0 512 512',
        path: <g>
        </g>
    },
    'fill-parcel': {
        version: '1.1',
        x: '0px',
        y: '0px',
        viewBox: '0 0 512 512',
        path: <g>
        </g>
    },
    'split-parcel': {
        version: '1.1',
        x: '0px',
        y: '0px',
        viewBox: '0 0 512 512',
        path: <g>
        </g>
    },
    'merge-parcel': {
        version: '1.1',
        x: '0px',
        y: '0px',
        viewBox: '0 0 512 512',
        path: <g>
        </g>
    },
}
Object.entries(_registry).forEach(v => assets.setSVG(v[0], v[1]));