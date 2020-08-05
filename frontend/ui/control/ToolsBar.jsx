import { React } from 'perun-core';
import { spatial } from '../../core';
import { PhysicalBlock } from '..';

const { Tab, Tabs, Selection, Measurement, Import, Export  } = spatial.ui;

export const ToolsBar = () =>
    <div id='toolsbar' >
        <Tabs defaultActiveKey='physical-block' >
            <Tab eventKey='physical-block' title='Физички блок' ><PhysicalBlock /></Tab> 
            <Tab eventKey='selection' title='Избирање' ><Selection /></Tab>
            <Tab eventKey='measurement' title='Мерење' ><Measurement /></Tab>
            <Tab eventKey='import' title='Увезување' ><Import /></Tab>
            <Tab eventKey='export' title='Извезување' ><Export /></Tab>
        </Tabs>
    </div>;
