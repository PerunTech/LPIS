import { React } from 'perun-core';
import { spatial } from '../../core';

const { ButtonGroup, Button, Icon } = spatial.ui

export const PhysicalBlock = () =>
    <ButtonGroup id='physical-block' >
        <Button >
            <Icon name='selection' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Избери геометрија</span>
        </Button>
        <Button >
            <Icon name='selection-polygon' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Избери со полигон</span>
        </Button>
        <Button >
            <Icon name='selection-frame' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Избери со рамка</span>
        </Button>
        <Button >
            <Icon name='selection-radius' size='30px' />
            <span style={{display: 'block', marginTop: '5px' }}>Избери со радиус</span>
        </Button>
        <Button >
            <Icon name='informer' size='28px' />
            <span style={{display: 'block', marginTop: '5px' }}>Информатор</span>
        </Button>
    </ButtonGroup>;