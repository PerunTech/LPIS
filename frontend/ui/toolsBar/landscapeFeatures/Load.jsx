import { React, Loading, elements } from 'perun-core'
import { core, ui } from '../../../Spatial';
import { ProcessButton } from '../ProcessButton';

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
      alertUser(true, 'info', 'Не се пронајдени вчитани пејсажни обележја')
    } else {
      setState({ landscapeFeaturesHaveBeenLoaded: false })
    }
  }

  return (
    <React.Fragment>
      <ProcessButton disabled id={_id} onClick={loadLandscapeFeatures}>
        <Icon name={_iconId} size='30px' />
        <span style={{ display: "block", marginTop: '5px' }}>Вчитај</span>
        {loading && <Loading />}
      </ProcessButton>
      <ProcessButton disabled id={_secondaryId} onClick={removeLandscapeFeatures}>
        <Icon name={_secondaryIconId} size='30px' />
        <span style={{ display: "block", marginTop: '5px' }}>Отстрани</span>
      </ProcessButton>
      {loading && <Loading />}
    </React.Fragment>
  )
}

export const Load = connect(state => ({
  processID: state.app.processID
}))(_Load)
