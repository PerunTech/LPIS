import { React } from 'perun-core';
import { factory } from '../core';

const Lpis = () => {
    const { Provider, MapContainer } = factory.core;

    return <Provider children={<MapContainer />} />
}


export const lpis = {
    init () {
        return Lpis;
    }
}