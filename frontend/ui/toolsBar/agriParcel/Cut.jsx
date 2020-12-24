import { React } from 'perun-core';
import { ui } from '../../../Spatial';

const { Button, Icon } = ui;

export const Cut = () => 
        <Button >
            <Icon name='cut-ap' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Пресечи парцела</span>
        </Button>