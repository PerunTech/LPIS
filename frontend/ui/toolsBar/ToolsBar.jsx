import { React, redux, createHashHistory } from 'perun-core';
import { spatial } from '../../core';
import { Parcels, AdvanceDigitization, IO } from '..';

const { Tab, Tabs, Button, Icon, Selection, Measurement } = spatial.ui;
const { store, logoutUser } = redux;
const history = createHashHistory();

export const ToolsBar = () => 
    <div id='toolsbar' >
        <Button disabled className='left-corner-filler' />
        <Button 
            onClick={() => history.push('/')} 
            className='toolbar-home'
            title='Кон почетна'>
                <Icon name='home' size='18px' style={{fill: '#3a3a3a'}} />
        </Button>
        <Tabs defaultActiveKey='parcels' >
            <Tab eventKey='parcels' title='Парцели' ><Parcels /></Tab> 
            <Tab eventKey='advance-digitization' title='Напредна Дигитизација' ><AdvanceDigitization /></Tab> 
            <Tab eventKey='selection' title='Селекција' ><Selection /></Tab>
            <Tab eventKey='measurement' title='Мерења' ><Measurement /></Tab>
            <Tab eventKey='io' title='Увезување / Извезување' ><IO /></Tab>
        </Tabs>
        <Button disabled className='right-corner-filler' />
        <Button 
            onClick={() => console.log('tbd')} 
            className='toolbar-settings'
            title='Поставки'>
                <Icon name='settings' size='18px' />
        </Button>
        <Button 
            onClick={() => {
                store.dispatch(logoutUser(
                    window.server 
                    + '/SvSecurity/logout/' 
                    + store.getState().security.svSession));
                history.push('/');
            }} 
            className='toolbar-logout'
            title='Одјави се'>
                <Icon name='logout' size='20px' />
        </Button>
    </div>;