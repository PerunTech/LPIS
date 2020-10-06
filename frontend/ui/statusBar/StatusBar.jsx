import { React } from 'perun-core';
import { spatial } from '../../core';

const  { CoordinatesControl, CRSControl, ScaleControl } = spatial.ui;

export function StatusBar () {
    return <>
        <CoordinatesControl />
        <ScaleControl />
        <CRSControl />
        <a 
            href='http://www.perun.tech/' 
            target='_blank'
            rel= 'noopener noreferrer' 
            className='author-link' >
                Perun Technologies ©
        </a>
    </>
}