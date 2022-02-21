import { React } from 'perun-core';
import { data, ui, core } from '../../Spatial';

const { useState, useEffect } = React;
const { ButtonGroup, Button, Icon, Divider } = ui;

export const LayerPanel = () => {
    const [isOpen, open] = useState(true);

    useEffect(() => {
        isOpen ? data.layerList?.expand() : data.layerList?.collapse();
    }, [isOpen])

    return <div id='layer-panel' >
        {core.store.getState().map.id === 'gsaa-map'
            ? <></>
            : <ButtonGroup style={{ height: isOpen ? '50px' : '60px' }}>
                {isOpen && <>
                    <Button disabled className='as-label layer-panel-title' >Листа на слоеви</Button>
                    <Divider style={{ margin: '10px 10px 10px 10px' }} />
                </>}
                <Button id='layer-panel-toggle' disabled style={!isOpen ? { width: '60px', height: '60px' } : {}} >
                    <Button onClick={() => open(!isOpen)} >
                        <Icon name={isOpen ? 'chevron-right' : 'chevron-left'} size='12px' />
                    </Button>
                </Button>
            </ButtonGroup>
        }
    </div>
};