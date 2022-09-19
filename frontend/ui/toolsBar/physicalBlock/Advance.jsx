import { React } from 'perun-core';
import { ui } from '../../../Spatial';

const { ButtonGroup, Button, Icon } = ui;

export const AdvanceDigitization = () =>
    <ButtonGroup id='advance-digitization' >
        <Button disabled >
            <Icon name='cut-pb' size='30px' />
            <span style={{ display: 'block', marginTop: '5px' }}>Пресечи блок</span>
        </Button>
        <Button disabled >
            <Icon name='fill-pb' size='34px' />
            <span style={{ display: 'block', marginTop: '2px' }}>Пополни блок</span>
        </Button>
        <Button disabled >
            <Icon name='split-pb' size='30px' />
            <span style={{ display: 'block', marginTop: '5px' }}>Подели блок</span>
        </Button>
        <Button disabled >
            <Icon name='merge-pb' size='30px' />
            <span style={{ display: 'block', marginTop: '5px' }}>Приспои блок</span>
        </Button>
    </ButtonGroup>;
