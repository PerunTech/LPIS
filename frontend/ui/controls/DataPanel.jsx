import { React } from 'perun-core';
import { spatial } from '../../core';

const { useState} = React;
const { ButtonGroup, Button, Icon, Divider } = spatial.ui;

export const DataPanel = () => {
    const [open, isOpen] = useState(true);

    return <div id='data-panel' style={open ? {width: '249px'} : {}}>
        <ButtonGroup>
            <Button id='data-panel-toggle' disabled style={!open ? {width: '60px', height: '60px'} : {}} >
                <Button onClick={() => isOpen(!open)} >
                    <Icon name={open ? 'chevron-left' : 'chevron-right'} size='12px' />
                </Button> 
            </Button>
            {open && <>
                <Divider style={{margin: '10px 10px 10px 10px'}} />
                <Button disabled className='as-label data-panel-title' >Работна листа</Button>
            </>}
        </ButtonGroup>
        <Divider vertical={false} style={{margin: '0px'}} />
    </div>;
} 