import { React, PropTypes, redux, createHashHistory } from 'perun-core';
import { ui, core } from '../../Spatial';
import { CropParcel } from '..';
// import { restAP } from '../editGrid/Config';

const { Button, Icon } = ui;
const { store, logoutUser } = redux;
const history = createHashHistory();

const _MiniBar = ({processID}) => 
    <div id='minibar' >
        <Button 
            onClick={() => history.push('/')} 
            className='toolbar-home'
            title='Кон почетна'>
                <Icon name='home' size='18px' style={{fill: '#3a3a3a'}} />
        </Button>
        <CropParcel processID={processID} />
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

_MiniBar.propTypes = {
    processID: PropTypes.string,
}

export const MiniBar = core.connect(state => 
    ({ processID: state.app.processID }))(_MiniBar);

// core.store.addState('http', restAP);