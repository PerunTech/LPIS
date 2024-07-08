import { React, PropTypes, redux, createHashHistory } from 'perun-core';
import { ui, core } from '../../Spatial';
import { PhysicalBlock, LandscapeFeatures, AgriParcel, CropParcel, Measurement, IO } from '..';
import { Digitization } from './agriParcel/digitization/Digitization';
import { getLabel, strcmp } from '../Util';

const { Tab, Tabs, Button, Icon, Selection } = ui;
const { store } = core;
const { store: perunStore, logoutUser } = redux;
const history = createHashHistory();

const _ToolsBar = ({ actionType, activeTab, weAreRenderingDirectly }) => {
    const handleHome = () => {
        history.push('/')
    }

    const handleBack = () => {
        if (actionType === 'preview') {
            const ostcPathName = perunStore.getState()?.['otscm_iacs.ipardFarmerInfo']?.controlPath
            if (ostcPathName) {
                history.push(ostcPathName)
            } else {
                history.goBack()
            }
        } else {
            if (actionType) {
                const tableName = strcmp(actionType, 'sizp') ? 'AGRI_PARCEL' : 'PPLAN'
                perunStore.dispatch({ type: 'BACK_FROM_LPIS', payload: { backFromLpis: true, tableName } })
            }
            history.goBack()
        }
    }

    const handleTabSelection = (key) => {
        store.dispatch({ activeTab: key })
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

    const getToolsbarClassName = () => {
        let toolsbarClassName = 'toolsbar'
        if (window.lpisIsDirectlyAccessed) {
            toolsbarClassName += ' toolsbar-directly-accessed'
        }
        return toolsbarClassName
    }

    return (
        <div id='toolsbar' className={getToolsbarClassName()}>
            {!window.lpisIsDirectlyAccessed && (
                <Button disabled className='left-corner-filler' />
            )}
            {!window.lpisIsDirectlyAccessed && (
                <div className='toolbar-left-buttons-container'>
                    {!weAreRenderingDirectly && (
                        <React.Fragment>
                            <Button
                                onClick={handleHome}
                                className='toolbar-left-button toolbar-left-home-button'
                                title={getLabel('home')}>
                                <Icon name='home' size='18px' style={{ fill: '#3a3a3a' }} />
                            </Button>
                            <Button
                                onClick={handleBack}
                                className='toolbar-left-button toolbar-left-back-button'
                                title={getLabel('back')}>
                                <Icon name='back' size='18px' style={{ fill: '#3a3a3a' }} />
                            </Button>
                        </React.Fragment>
                    )}
                </div>
            )}
            <Tabs defaultActiveKey={getDefaultActiveKey} activeKey={activeTab} onSelect={(key) => handleTabSelection(key)}>
                <Tab eventKey='physical-block' title={getLabel('physical_blocks')} disabled={disableTab('physical-block')} >
                    <PhysicalBlock />
                </Tab>
                <Tab eventKey='landscape-features' title={getLabel('landscape_features')} disabled={disableTab('landscape-features')} >
                    <LandscapeFeatures />
                </Tab>
                <Tab eventKey='agri-parcel' title={getLabel('agri_parcels')} disabled={disableTab('agri-parcel')} >
                    {actionType === 'sizp' ? <Digitization /> : <AgriParcel />}
                </Tab>
                <Tab eventKey='crop-parcel' title={getLabel('crop_parcels')} disabled={disableTab('crop-parcel')} >
                    <CropParcel />
                </Tab>
                <Tab eventKey='selection' title={getLabel('selection')} ><Selection /></Tab>
                <Tab eventKey='measurement' title={getLabel('measurement')} ><Measurement /></Tab>
                <Tab eventKey='io' title={getLabel('import_export')} ><IO /></Tab>
            </Tabs>
            {!window.lpisIsDirectlyAccessed && (
                <Button disabled className='right-corner-filler' />
            )}
            {!weAreRenderingDirectly && (
                <React.Fragment>
                    {!window.lpisIsDirectlyAccessed && (
                        <Button
                            onClick={() => console.log('tbd')}
                            className='toolbar-settings'
                            title={getLabel('settings')}>
                            <Icon name='settings' size='18px' />
                        </Button>
                    )}
                    <Button
                        onClick={() => {
                            perunStore.dispatch(logoutUser(
                                window.server
                                + '/SvSecurity/logout/'
                                + perunStore.getState().security.svSession));
                            history.push('/');
                        }}
                        className='toolbar-logout'
                        title={getLabel('logout')}>
                        <Icon name='logout' size='20px' />
                    </Button>
                </React.Fragment>
            )}
        </div>
    );
}

_ToolsBar.propTypes = {
    actionType: PropTypes.string,
    activeTab: PropTypes.string
}

export const ToolsBar = core.connect(state => ({
    actionType: state.farmRegistry?.actionType,
    activeTab: state.farmRegistry?.activeTab,
    weAreRenderingDirectly: state.farmRegistry?.weAreRenderingDirectly,
}))(_ToolsBar);
