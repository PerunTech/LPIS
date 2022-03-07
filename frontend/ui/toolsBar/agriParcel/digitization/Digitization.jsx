import { React } from 'perun-core';
import { ui } from '../../../../Spatial';
import { ProcessButton } from '../../ProcessButton';
// Components
import { CommonUse } from './CommonUse';
import { Assign } from './Assign';
import { Copy } from './Copy';
import { Cut } from './Cut';
import { Delete } from './Delete';
import { DeleteParcelFromFarm } from './DeleteParcelFromFarm';
import { Draw } from './Draw';
import { Edit } from './Edit';
import { Fill } from './Fill';
import { Info } from './Info/Info';
import { Merge } from './Merge';
import { Refresh } from './Refresh';
import { Split } from './Split';

const { ButtonGroup, Divider, Icon } = ui;
const { useState } = React;
const caretLeftIcon = <Icon name='caret-left' size='16px' />
const caretRightIcon = <Icon name='caret-right' size='16px' />

export const Digitization = () => {
    const [firstGroupIsToggled, toggleFirstGroup] = useState(false)
    const [secondGroupIsToggled, toggleSecondGroup] = useState(true)

    const onFirstGroupClick = () => {
        toggleFirstGroup(!firstGroupIsToggled)
        toggleSecondGroup(false)
    }

    const onSecondGroupClick = () => {
        toggleFirstGroup(false)
        toggleSecondGroup(!secondGroupIsToggled)
    }

    return <ButtonGroup>
        <Divider />
        <ProcessButton id='toggle-first-group' onClick={onFirstGroupClick}>
            {firstGroupIsToggled ? caretLeftIcon : caretRightIcon}
        </ProcessButton>
        {firstGroupIsToggled && <React.Fragment>
            <Copy />
            <Info />
        </React.Fragment>}
        <Divider />
        <ProcessButton id='toggle-second-group' onClick={onSecondGroupClick}>
            {secondGroupIsToggled ? caretLeftIcon : caretRightIcon}
        </ProcessButton>
        {secondGroupIsToggled && <React.Fragment>
            <Draw />
            <Edit />
            <Cut />
            <Split />
            <Merge />
            <Fill />
        </React.Fragment>}
        <Divider />
        <Refresh />
        <Divider />
        <Assign />
        <CommonUse />
        <DeleteParcelFromFarm />
        <Delete />
    </ButtonGroup>;
}
