/* css.elements */
import './css/elements/form.css'

/* css.dataPanel */
import './css/dataPanel/dataGrid.css'
import './css/dataPanel/dataList.css'
import './css/dataPanel/dataPanel.css';

/* css.control */
import './css/control/statusBar.css';
import './css/control/toolsBar.css';
import './css/control/miniBar.css';
import './css/control/layerPanel.css';

/* css.digitization */
import './css/digitization/physicalBlock.css'
import './css/digitization/agriParcel.css'
import './css/digitization/cropParcel.css'

/* css.edbar, adapt rules to edbar style  */
import './css/edbar/gsaa.css'

/**
 * Include local svg registry in build.
 * 
 * No relevant exports provided, local icons are added to the base registry in spatial
 * and all modules communicate directly to the base registry.
 */
import './svg/Registry';