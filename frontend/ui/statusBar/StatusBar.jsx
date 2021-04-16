import { React } from 'perun-core';
import { ui, core } from '../../Spatial';

const  { CoordinatesControl, CRSControl, ScaleControl } = ui;

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
                {core.store.getState().map.id !== 'gsaa-map' && 'Perun Technologies ©'}
        </a>
    </>
}