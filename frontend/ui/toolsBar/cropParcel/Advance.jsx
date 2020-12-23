import { React } from 'perun-core';
import { ui } from '../../../Spatial';

const { ButtonGroup, Button, Icon } = ui;

export const AdvanceDigitization = () =>
    <ButtonGroup id='advance-digitization' >
        <Button disabled >
            <Icon name='cut-cp' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Пресечи производна парцела</span>
        </Button>
        <Button disabled >
            <Icon name='fill-cp' size='34px' />
            <span style={{display: 'block', marginTop: '2px' }}>Пополни производна парцела</span>
        </Button>
        <Button disabled >
            <Icon name='split-cp' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Подели производна парцела</span>
        </Button>
        <Button disabled >
            <Icon name='merge-cp' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Приспои производна парцела</span>
        </Button>
    </ButtonGroup>;