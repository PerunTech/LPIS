import { React } from 'perun-core';
import { spatial } from '../../core';

const { useState, useEffect } = React;
const { ButtonGroup, Button, Icon, Divider } = spatial.ui;

export const LayerPanel = () => {
    const [isOpen, open] = useState(true);

    useEffect(() => {
        isOpen ? spatial.data.layerList.expand() : spatial.data.layerList.collapse();
    }, [isOpen])

    return <div id='layer-panel' >
        <ButtonGroup style={{height: isOpen ? '50px' : '60px'}}>
            {isOpen && <>
                <Button disabled className='as-label layer-panel-title' >Листа на слоеви</Button>
                <Divider style={{margin: '10px 10px 10px 10px'}} />
            </>}
            <Button id='layer-panel-toggle' disabled style={!isOpen ? {width: '60px', height: '60px'} : {}} >
                <Button onClick={() => open(!isOpen)} >
                    <Icon name={isOpen ? 'chevron-right' : 'chevron-left'} size='12px' />
                </Button> 
            </Button>
        </ButtonGroup>
        <Divider vertical={false} style={{margin: '0px'}} />
    </div>
};