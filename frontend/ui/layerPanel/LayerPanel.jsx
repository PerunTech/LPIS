import { React } from 'perun-core';
import { ui, core } from '../../Spatial';
import { getLabel } from '../Util';

const { connect } = core;
const { ButtonGroup, Button, Icon, Divider } = ui;
const { useState, useEffect } = React;

const _LayerPanel = ({ layerControl }) => {
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        isOpen ? layerControl?.expand() : layerControl?.collapse();
    }, [isOpen])

    const onButtonClick = () => {
        setIsOpen(!isOpen)
    }

    return (
        <div id='layer-panel' >
            <ButtonGroup style={{ height: isOpen ? '50px' : '60px' }}>
                {isOpen && (
                    <React.Fragment>
                        <Button disabled className='as-label layer-panel-title' >{getLabel('layer_list')}</Button>
                        <Divider style={{ margin: '10px 10px 10px 10px' }} />
                    </React.Fragment>
                )}
                <Button id='layer-panel-toggle' onClick={onButtonClick} style={!isOpen ? { width: '60px', height: '60px' } : {}} >
                    <Icon name={isOpen ? 'chevron-right' : 'chevron-left'} size='12px' />
                </Button>
            </ButtonGroup>
        </div>
    )
};

export const LayerPanel = connect(state => ({
    layerControl: state.app.layerControl
}))(_LayerPanel);
