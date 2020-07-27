import { React } from 'perun-core';
import { factory } from '../core';

export const Lpis = () => {
    const { Provider, MapContainer } = factory.core;

    return <Provider children={<MapContainer />} />
}