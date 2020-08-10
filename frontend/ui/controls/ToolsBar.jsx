import { React, createHashHistory } from 'perun-core';
import { spatial } from '../../core';
import { PhysicalBlock, IO } from '..';

const { Tab, Tabs, Button, Icon, Selection, Measurement } = spatial.ui;
const history = createHashHistory();

export const ToolsBar = () => 
    <div id='toolsbar' >
        <Button onClick={() => history.push('/')} className='toolbar-home btn_background'>
            <Icon name='home' size='20px' />
        </Button>
        <Tabs defaultActiveKey='digitization' >
            <Tab eventKey='digitization' title='Дигитизација' >
                <PhysicalBlock />
            </Tab> 
            <Tab eventKey='selection' title='Селекција' >
                <Selection />
            </Tab>
            <Tab eventKey='measurement' title='Мерења' >
                <Measurement />
            </Tab>
            <Tab eventKey='io' title='Увезување / Извезување' >
                <IO />
            </Tab>
        </Tabs>
        <Button onClick={() => history.push('/')} className='toolbar-logout btn_background'>
            <Icon name='logout' size='22px' />
        </Button>
    </div>;