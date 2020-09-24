import { React } from 'perun-core';
import { spatial } from '../../core';
import { DataList } from '..';

const { useState} = React;
const { ButtonGroup, Button, Icon, Divider, Input } = spatial.ui;

export const DataPanel = () => {
    const [open, isOpen] = useState(true);
    return <div id='data-panel' style={open ? {width: '299px'} : {}}>
        <ButtonGroup>
            <Button id='data-panel-toggle' disabled style={!open ? {width: '60px', height: '60px', backgroundColor: '#F9F9F9'} : {}} >
                <Button onClick={() => isOpen(!open)} >
                    <Icon name={open ? 'chevron-left' : 'chevron-right'} size='12px' />
                </Button> 
            </Button>
            {open && <>
                <Divider style={{margin: '10px 10px 10px 0px'}} />
                <Button disabled className='as-label data-panel-title' >Работна листа</Button>
            </>}
        </ButtonGroup>
        <Divider vertical={false} style={{margin: '0px'}} />
        <ButtonGroup className='data-list-utils' >
            <Button onClick={() => {}}  >
                <Icon name='add-data-list-item' size='18px' />
            </Button>
            <Button onClick={() => {}} >
                <Icon name='load-data-list' size='22px' />
            </Button>
            <Divider />
            <Button onClick={() => {}} >
                <Icon name='save' size='16px' />
            </Button> 
            <Button onClick={() => {}} >
                <Icon name='export' size='18px' />
            </Button> 
            <Divider />
            <Button onClick={() => {}} >
                <Icon name='refresh' size='16px' />
            </Button> 
            <Button onClick={() => {}} >
                <Icon name='collapse-all' size='18px' />
            </Button> 
        </ButtonGroup>
        <Input placeholder='Пребарај' style={{padding: '1rem', backgroundColor: '#fff', textIndent: '5px'}} />
        <DataList />
    </div>;
} 