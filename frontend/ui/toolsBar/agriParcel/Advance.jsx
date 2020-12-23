import { React } from 'perun-core';
import { ui } from '../../../Spatial';

const { ButtonGroup, Button, Icon } = ui;

export const AdvanceDigitization = () =>
    <ButtonGroup id='advance-digitization' >
        <Button >
            <Icon name='merge-ap' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Приспои парцели</span>
        </Button>
        <Button >
            <Icon name='split-ap' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Подели парцела</span>
        </Button>
        <Button >
            <Icon name='fill-ap' size='34px' />
            <span style={{display: 'block', marginTop: '2px' }}>Пополни парцела</span>
        </Button>
        <Button >
            <Icon name='cut-ap' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Пресечи парцела</span>
        </Button>
    </ButtonGroup>;