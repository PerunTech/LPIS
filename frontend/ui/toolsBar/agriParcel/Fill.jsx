import { React } from 'perun-core';
import { ui } from '../../../Spatial';

const { Button, Icon } = ui;

export const Fill = () => 
        <Button >
            <Icon name='fill-ap' size='34px' />
            <span style={{display: 'block', marginTop: '2px' }}>Пополни парцела</span>
        </Button>