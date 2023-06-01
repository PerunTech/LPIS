import { React, PropTypes, redux, createHashHistory } from 'perun-core';
import { ui, core } from '../../Spatial';
import { PhysicalBlock, LandscapeFeatures, AgriParcel, CropParcel, Measurement, IO } from '..';
import { Digitization } from './agriParcel/digitization/Digitization';

const { Tab, Tabs, Button, Icon, Selection } = ui;
const { store } = core;
const { perunStore, logoutUser } = redux;
const history = createHashHistory();

const _ToolsBar = ({ actionType }) => {
    const handleHome = () => {
        history.push('/')
    }

    const handleBack = () => {
        if (actionType === 'pplan') {
            history.push('/main/iacs-claims/p_plan')
        } else if (actionType === 'preview') {
            const ostcPathName = perunStore.getState()?.['otscm_iacs.ipardFarmerInfo']?.controlPath
            if (ostcPathName) {
                history.push(ostcPathName)
            } else {
                history.goBack()
            }
        } else {
            history.goBack()
        }
    }

    const getDefaultActiveKey = () => {
        let defaultActiveKey = ''
        switch (actionType) {
            case 'preview':
                defaultActiveKey = 'io'
                break;
            case 'sizp':
                defaultActiveKey = 'agri-parcel'
                break
            case 'pplan':
                defaultActiveKey = 'crop-parcel'
                break
            default:
                defaultActiveKey = 'physical-block'
                break
        }
        store.dispatch({ activeTab: defaultActiveKey })
        return defaultActiveKey
    }

    const disableTab = tabType => {
        let shouldDisable = false
        switch (tabType) {
            case 'physical-block':
                if (actionType === 'pplan' || actionType === 'preview') {
                    shouldDisable = true
                }
                break
            case 'landscape-features':
                if (actionType === 'pplan' || actionType === 'preview' || !actionType) {
                    shouldDisable = true
                }
                break
            case 'agri-parcel':
                if (actionType === 'pplan' || actionType === 'preview' || !actionType) {
                    shouldDisable = true
                }
                break
            case 'crop-parcel':
                if (actionType === 'sizp' || actionType === 'preview' || !actionType) {
                    shouldDisable = true
                }
                break
            default: break
        }
        return shouldDisable
    }

    return <div id='toolsbar'>
        <Button disabled className='left-corner-filler' />
        <div className='toolbar-left-buttons-container'>
            <Button
                onClick={handleHome}
                className='toolbar-left-button toolbar-left-home-button'
                title='Кон почетна'>
                <Icon name='home' size='18px' style={{ fill: '#3a3a3a' }} />
            </Button>
            <Button
                onClick={handleBack}
                className='toolbar-left-button'
                title='Назад'>
                <Icon name='back' size='18px' style={{ fill: '#3a3a3a' }} />
            </Button>
        </div>
        <Tabs defaultActiveKey={getDefaultActiveKey} >
            <Tab eventKey='physical-block' title='Физички блокови' disabled={disableTab('physical-block')} >
                <PhysicalBlock />
            </Tab>
            <Tab eventKey='landscape-features' title='Пејсажни обележја' disabled={disableTab('landscape-features')} >
                <LandscapeFeatures />
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
                perunStore.dispatch(logoutUser(
                    window.server
                    + '/SvSecurity/logout/'
                    + perunStore.getState().security.svSession));
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
