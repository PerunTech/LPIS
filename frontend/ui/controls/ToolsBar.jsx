import { React, redux, createHashHistory } from 'perun-core';
import { spatial } from '../../core';
import { Digitization, IO } from '..';

const { Tab, Tabs, Button, Icon, Selection, Measurement } = spatial.ui;
const { store, logoutUser } = redux;
const history = createHashHistory();

export const ToolsBar = () => 
    <div id='toolsbar' >
        <Button 
            onClick={() => history.push('/')} 
            className='toolbar-home btn_background'
            title='Кон почетна'>
                <Icon name='home' size='20px' style={{fill: '#5a5a5a'}} />
        </Button>
        <Tabs defaultActiveKey='digitization' >
            <Tab eventKey='digitization' title='Дигитизација' >
                <Digitization />
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
        <Button 
            onClick={() => console.log('tbd')} 
            className='toolbar-docs btn_background'
            title='Документи'>
                <Icon name='docs' size='22px' />
        </Button>
        <Button 
            onClick={() => {
                store.dispatch(logoutUser(
                    window.server 
                    + '/SvSecurity/logout/' 
                    + store.getState().security.svSession));
                history.push('/');
            }} 
            className='toolbar-logout btn_background'
            title='Одјави се'>
                <Icon name='logout' size='22px' />
        </Button>
    </div>;