import { React } from 'perun-core';
import { spatial } from '../../core';

const { useState, useEffect } = React;
const { ButtonGroup, Button, Icon, Divider } = spatial.ui;
const { layerControl } = spatial.data

export const LayerPanel = () => {
    const [open, isOpen] = useState(true);

    useEffect(() => {
        open ? layerControl.expand() : layerControl.collapse();
    }, [open])

    return <div id='layer-panel' >
        <ButtonGroup>
            {open && <>
                <Button disabled className='as-label layer-panel-title' >Листа на слоеви</Button>
                <Divider style={{margin: '10px 10px 10px 10px'}} />
            </>}
            <Button id='layer-panel-toggle' disabled style={!open ? {width: '60px', height: '60px'} : {}} >
                <Button onClick={() => isOpen(!open)} >
                    <Icon name={open ? 'chevron-right' : 'chevron-left'} size='12px' />
                </Button> 
            </Button>
        </ButtonGroup>
        <Divider vertical={false} style={{margin: '0px'}} />
    </div>
};