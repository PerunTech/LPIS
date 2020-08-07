import { React } from 'perun-core';
import { spatial } from '../../core';

const { ButtonGroup, Button, Icon, Divider } = spatial.ui;
const { useState } = React;
console.log('moved to const')

export const LayerPanel = () => {
    const [open, isOpen] = useState(true);

    return <div id='layer-panel' >
        <ButtonGroup>
            <Button disabled className='as-label layer-panel-title' >Листа на слоеви</Button>
            <Divider style={{margin: '10px 10px 10px 10px'}} />
            <Button id='layer-panel-toggle' disabled >
                <Button onClick={() => isOpen(!open)} >
                    <Icon name={open ? 'chevron-right' : 'chevron-left'} size='12px' />
                </Button> 
            </Button>
        </ButtonGroup>
        <Divider vertical={false} style={{margin: '0px'}} />
    </div>
};