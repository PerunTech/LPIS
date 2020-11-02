import { React } from 'perun-core';
import { spatial } from '../../../core';

const { ButtonGroup, Button, Icon } = spatial.ui;

export const AdvanceDigitization = () =>
    <ButtonGroup id='advance-digitization' >
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