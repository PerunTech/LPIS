import { React } from 'perun-core'
import { core } from '../../Spatial';

const _FarmDataGridInfoHeader = ({ fic, fullName }) => {
  return <div className='fr-info-header'>
    {fic && <div className='header-info-wrapper'>
      <h3 className='info-header-title'>ИДБР:</h3>
      <span className='info-header-span'>{fic}</span>
    </div>}
    {fullName && <div className='header-info-wrapper'>
      <h3 className='info-header-title'>Целосно име:</h3>
      <span className='info-header-span'>{fullName}</span>
    </div>}
  </div>
};

export const FarmDataGridInfoHeader = core.connect(state => ({
  fic: state.farmRegistry?.fic, fullName: state.farmRegistry?.fullName
}))(_FarmDataGridInfoHeader)
