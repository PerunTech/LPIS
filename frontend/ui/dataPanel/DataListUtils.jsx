import { React, PropTypes } from 'perun-core';
import { spatial } from '../../core';

const { store } = spatial.core;
const { ButtonGroup, Button, Icon, Divider, Input } = spatial.ui;

export const DataListUtils = ({setData}) => {
    const _refresh = () =>
        store.dispatch({ layers: store.getState().data.layers });
    const _expandAll = () => 
        setData(data => data.map(el => ({ ...el, isOpen: true })));
    const _collapseAll = () => 
        setData(data => data.map(el => ({ ...el, isOpen: false })));

    return <>
        <ButtonGroup className='data-list-utils' >
            <Button onClick={() => {}} title='Додади запис'  >
                <Icon name='add-data-list-item' size='18px' />
            </Button>
            <Button onClick={() => {}} title='Додади листа' >
                <Icon name='load-data-list' size='22px' />
            </Button>
            <Divider />
            <Button onClick={() => {}} title='Сочувај листа' >
                <Icon name='save' size='16px' />
            </Button> 
            <Button onClick={() => {}} title='Извези листа' >
                <Icon name='export' size='18px' />
            </Button> 
            <Divider />
            <Button onClick={_refresh} title='Освежи листа' >
                <Icon name='refresh' size='16px' />
            </Button> 
            <Button onClick={_collapseAll} title='Минимизирај листа' >
                <Icon name='collapse-all' size='18px' />
            </Button>
            <Button onClick={_collapseAll} title='Отстрани записи' >
                <Icon name='delete' size='18px' />
            </Button> 
        </ButtonGroup>
        <Input placeholder='Пребарај' style={{padding: '1rem', backgroundColor: '#fff', textIndent: '5px'}} />
    </>
}
DataListUtils.propTypes = {
    data: PropTypes.array,
    setData: PropTypes.func
}