import { React } from 'perun-core';
import { ui } from '../../../Spatial';

const { ButtonGroup, Button, Icon } = ui;

export const AdvanceDigitization = () =>
    <ButtonGroup id='advance-digitization' >
        <Button >
            <Icon name='cut-pb' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Пресечи физички блок</span>
        </Button>
        <Button >
            <Icon name='fill-pb' size='34px' />
            <span style={{display: 'block', marginTop: '2px' }}>Пополни физички блок</span>
        </Button>
        <Button >
            <Icon name='split-pb' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Подели физички блок</span>
        </Button>
        <Button >
            <Icon name='merge-pb' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Приспои физички блок</span>
        </Button>
    </ButtonGroup>;