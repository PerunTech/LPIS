import { React } from 'perun-core';
import { spatial } from '../../core';

const { ButtonGroup, Button, Icon, Divider } = spatial.ui

export const Digitization = () =>
    <ButtonGroup id='digitization' >
        <Button >
            <Icon name='add-pb' size='34px' />
            <span style={{display: 'block', marginTop: '1px' }}>Додади физички блок</span>
        </Button>
        <Button >
            <Icon name='edit-pb' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Промени физички блок</span>
        </Button>
        <Divider />
        <Button >
            <Icon name='cut-parcel' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Пресечи парцела</span>
        </Button>
        <Button >
            <Icon name='fill-parcel' size='34px' />
            <span style={{display: 'block', marginTop: '2px' }}>Пополни парцела</span>
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