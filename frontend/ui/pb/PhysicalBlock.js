import { React } from 'perun-core';
import { spatial } from '../../core';

const { ButtonGroup, Button, Icon } = spatial.ui

export const PhysicalBlock = () =>
    <ButtonGroup id='physical-block' >
        <Button >
            <Icon name='add-pb' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Додади физички блок</span>
        </Button>
        <Button >
            <Icon name='edit-pb' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Промени физички блок</span>
        </Button>
        <Button >
            <Icon name='cut-parcel' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Пресечи парцела</span>
        </Button>
        <Button >
            <Icon name='fill-parcel' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Пополни парцела</span>
        </Button>
        <Button >
            <Icon name='split-parcel' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Подели парцела</span>
        </Button>
        <Button >
            <Icon name='merge-parcel' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Приспои парцели</span>
        </Button>
    </ButtonGroup>;