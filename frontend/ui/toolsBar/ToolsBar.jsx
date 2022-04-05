import { React, PropTypes, redux, createHashHistory } from 'perun-core';
import { ui, core } from '../../Spatial';
import { PhysicalBlock, AgriParcel, CropParcel, IO } from '..';
import { Digitization } from './agriParcel/digitization/Digitization';

const { Tab, Tabs, Button, Icon, Selection, Measurement } = ui;
const { store, logoutUser } = redux;
const history = createHashHistory();

const _ToolsBar = ({ actionType }) => {
    const getDefaultActiveKey = () => {
        let defaultActiveKey = ''
        switch (actionType) {
            case 'sizp':
                defaultActiveKey = 'agri-parcel'
                break
            case 'pplan':
                defaultActiveKey = 'crop-parcel'
                break
            default: break
        }
        return defaultActiveKey
    }

    const disableTab = tabType => {
        let shouldDisable = false
        switch (tabType) {
            case 'physical-block':
                if (actionType === 'sizp' || actionType === 'pplan') {
                    shouldDisable = true
                }
                break
            case 'agri-parcel':
                if (actionType === 'pplan') {
                    shouldDisable = true
                }
                break
            case 'crop-parcel':
                if (actionType === 'sizp') {
                    shouldDisable = true
                }
                break
            default: break
        }
        return shouldDisable
    }

    return <div id='toolsbar' >
        <Button disabled className='left-corner-filler' />
        <Button
            onClick={() => history.goBack()}
            className='toolbar-home'
            title='Кон почетна'>
            <Icon name='home' size='18px' style={{ fill: '#3a3a3a' }} />
        </Button>
        <Tabs defaultActiveKey={getDefaultActiveKey} >
            <Tab eventKey='physical-block' title='Физички блокови' disabled={disableTab('physical-block')} >
                <PhysicalBlock />
            </Tab>
            <Tab eventKey='agri-parcel' title='Земјоделски Парцели' disabled={disableTab('agri-parcel')} >
                {actionType === 'sizp' ? <Digitization /> : <AgriParcel />}
            </Tab>
            <Tab eventKey='crop-parcel' title='Производни парцели' disabled={disableTab('crop-parcel')} >
                <CropParcel />
            </Tab>
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
}

_ToolsBar.propTypes = {
    actionType: PropTypes.string
}

export const ToolsBar = core.connect(state => ({ actionType: state.farmRegistry?.actionType }))(_ToolsBar);
