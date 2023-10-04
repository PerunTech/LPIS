import { React, Loading, elements } from 'perun-core'
import { core, ui } from '../../../Spatial';
import { ProcessButton } from '../ProcessButton';
import { getLabel } from '../../Util';

const { connect } = core;
const { Icon } = ui;
const { alertUser } = elements;
const { useReducer } = React;

const _id = 'loadLandscapeFeatures';
const _secondaryId = 'removeLandscapeFeatures';
const _iconId = 'copy';
const _secondaryIconId = 'erase';

const _Load = () => {
  const [{ loading, landscapeFeaturesHaveBeenLoaded }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { loading: false, landscapeFeaturesHaveBeenLoaded: false });

  const loadLandscapeFeatures = () => {

  }

  const removeLandscapeFeatures = () => {
    if (!landscapeFeaturesHaveBeenLoaded) {
      alertUser(true, 'info', `${getLabel('no_loaded_landscape_features_found')}`)
    } else {
      setState({ landscapeFeaturesHaveBeenLoaded: false })
    }
  }

  return (
    <React.Fragment>
      <ProcessButton disabled id={_id} onClick={loadLandscapeFeatures}>
        <Icon name={_iconId} size='30px' />
        <span style={{ display: "block", marginTop: '5px' }}>{getLabel('load')}</span>
        {loading && <Loading />}
      </ProcessButton>
      <ProcessButton disabled id={_secondaryId} onClick={removeLandscapeFeatures}>
        <Icon name={_secondaryIconId} size='30px' />
        <span style={{ display: "block", marginTop: '5px' }}>{getLabel('remove')}</span>
      </ProcessButton>
      {loading && <Loading />}
    </React.Fragment>
  )
}

export const Load = connect(state => ({
  processID: state.app.processID
}))(_Load)
