import { React } from 'perun-core';
import { spatial } from '../../core';

const { Button, Icon } = spatial.ui;

export const LayerPanel = () => {
    const [isOpen, open] = React.useState(true);

    return <div id='layer-panel' >
        <Button id='layer-panel-toggle' onClick={() => open(!isOpen)} >
            <Icon name={isOpen ? 'chevron-right' : 'chevron-left'} size='16px' />
        </Button>
    </div>
};