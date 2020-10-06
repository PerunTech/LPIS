import { React } from 'perun-core';
import { spatial } from '../../core';
import { PhysicalBlock } from '..';

const { ButtonGroup, Button, Icon, Divider } = spatial.ui

export const Digitization = () =>
    <ButtonGroup id='digitization' >
        <PhysicalBlock />
        <Divider />
        <Button >
            <Icon name='cut-parcel' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Пресечи полигон</span>
        </Button>
        <Button >
            <Icon name='fill-parcel' size='34px' />
            <span style={{display: 'block', marginTop: '2px' }}>Пополни полигон</span>
        </Button>
        <Button >
            <Icon name='split-parcel' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Подели полигон</span>
        </Button>
        <Button >
            <Icon name='merge-parcel' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Приспои полигон</span>
        </Button>
    </ButtonGroup>;