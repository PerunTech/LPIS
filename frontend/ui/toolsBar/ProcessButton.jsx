import { React, PropTypes } from 'perun-core';
import { core, ui } from '../../Spatial';

/**
 * A Button HOC that actively listens to the registered application process and records 
 * its own process when accessed (clicked).  Use in toolbars and menus where each action button
 * should be aware of potential actions on all other buttons in the screen. 
 * 
 * &nbsp;
 * 
 * @function ProcessButton(props: *): JSX
 * 
 * @param {*} props - Properties.
 * @param {string} [props.id] - The ID of the application process, acccessible via this button.
 * @param {string} [props.processID] - The currently active process id, recorded in the application store.
 * 
 * @returns JSX;
 */
function _ProcessButton ({ id, ...props }) {
    let classNames = [props.className ? `${props.className}` : '']
    if (props.processID === id) {
        classNames.push('active')
    }

    return <ui.Button {...props}
        id={id}
        className={classNames.join(' ')}
        disabled={!props.digitizationIsActive || String(props.processID).length > 0} >
        {props.children}
    </ui.Button>
}

_ProcessButton.propTypes = {
    id: PropTypes.string.isRequired,
    children: PropTypes.node,
    processID: PropTypes.string,
}

export const ProcessButton = core.connect((state) => {
    return { processID: state.app.processID, digitizationIsActive: state.farmRegistry?.digitizationIsActive };
})(_ProcessButton);