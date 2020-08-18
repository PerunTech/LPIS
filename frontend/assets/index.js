/* css.elements */
import './css/elements/form.css'

/* css.control */
import './css/control/dataPanel.css'
import './css/control/statusBar.css'
import './css/control/toolsBar.css';
import './css/control/layerPanel.css';

/* css.digitization */
import './css/digitization/physicalBlock.css'

/**
 * Include local svg registry in build.
 * 
 * No relevant exports provided, local icons are added to the base registry in spatial
 * and all modules communicate directly to the base registry.
 */
import './svg/Registry';