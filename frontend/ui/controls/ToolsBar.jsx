import { React } from 'perun-core';
import { spatial } from '../../core';
import { PhysicalBlock, IO } from '..';

const { Tab, Tabs, Selection, Measurement } = spatial.ui;

export const ToolsBar = () => 
    <div id='toolsbar' >
        <Tabs defaultActiveKey='digitization' >
            <Tab eventKey='digitization' title='Дигитизација' >
                <PhysicalBlock />
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
    </div>;
