import { React } from 'perun-core'
import { core } from '../../Spatial';
import { strcmp } from '../Util';
import { truncate } from './Util';

const _FarmDataGridInfoHeader = ({ actionType, fic, fullName }) => {
  let finalFullName = fullName
  let fullNameMaxLength = 25
  if (strcmp(actionType, 'sizp')) {
    fullNameMaxLength = 45
  }
  if (finalFullName && finalFullName?.length > fullNameMaxLength) {
    finalFullName = truncate(finalFullName, fullNameMaxLength, true)
  }

  return <div className='fr-info-header'>
    {fic && <div className='header-info-wrapper'>
      <h3 className='info-header-title'>ИДБР:</h3>
      <span className='info-header-span' title={fic}>{fic}</span>
    </div>}
    {fullName && <div className='header-info-wrapper'>
      <h3 className='info-header-title'>Целосно име:</h3>
      <span className='info-header-span' title={fullName}>{finalFullName}</span>
    </div>}
  </div>
};

export const FarmDataGridInfoHeader = core.connect(state => ({
  actionType: state.farmRegistry?.actionType, fic: state.farmRegistry?.fic, fullName: state.farmRegistry?.fullName
}))(_FarmDataGridInfoHeader)
