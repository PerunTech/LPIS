import { React, Loading, elements } from 'perun-core';
import { core, ui } from '../../../../../Spatial';
import { parcelInfoMsg } from '../../Config';
import { ProcessButton } from '../../../ProcessButton';
import { Guidance } from '../../Guidance';
import { strcmp } from '../../../../Util';

const { Map, store, http } = core;
const { Icon } = ui;
const { alertUser } = elements;
const { useEffect, useReducer } = React;
const _id = 'help';

const _Info = ({ processID }) => {
  const [{ isGuided, loading }, setState] = useReducer((currState, update) =>
    ({ ...currState, ...update }),
    { isGuided: false, loading: false });

  useEffect(() => {
    return () => {
      store.dispatch({ showParcelInfoContainer: false, farmInfo: undefined, parcelInfo: undefined })
    }
  }, [])

  const enable = () => {
    setState({ isGuided: true })
    store.dispatch({ processID: _id });
    Map.on('click', (e) => {
      const p = Map.transform(e.latlng);
      setState({ X: p.x, Y: p.y, loading: true });
      const url = `/lpis/info/agriParcel/{init.token}/AGRI_PARCEL/${p.x}/${p.y}`
      http.call('get-parcel-info', { url }).then((response) => {
        if (response.data.items && Array.isArray(response.data.items) && response.data?.items.length >= 1) {
          store.dispatch({ farmInfo: undefined, parcelInfo: undefined })
          let farmInfo = {}
          let parcelInfo = {}
          response.data.items.forEach(item => {
            if (item.FIC) {
              farmInfo = item
            }
            if (strcmp(item.DESCRIPTOR, 'AGRI_PARCEL') || (item.ALLOWED_AREA || item.AREA)) {
              parcelInfo = item
            }
          })
          setState({ loading: false })
          store.dispatch({ farmInfo, parcelInfo, showParcelInfoContainer: true })
        } else {
          setState({ loading: false })
          alertUser(true, 'info', 'Нема податоци за избраната парцела или не е избрана парцела од мапата');
        }
      }).catch((err) => {
        console.log(err);
        setState({ loading: false })
        alertUser(true, 'info', 'Нема податоци за избраната парцела или не е избрана парцела од мапата');
      });
    });
  };

  const disable = () => {
    Map.off('click');
    // Reset state, internal and application-wide.
    setState({ loading: false, isGuided: false });
    store.dispatch({ processID: '' });
  };

  const renderGuideForm = () => {
    return <Guidance id={_id} disable={disable} msg={parcelInfoMsg} title='Информации за парцела' />
  }

  const renderComponent = () => {
    let componentToRender = null

    if (isGuided) {
      componentToRender = renderGuideForm()
    } else {
      componentToRender = null
    }

    return componentToRender
  }

  return (
    <ProcessButton id={_id} onClick={enable} title='Информации за парцела'>
      <Icon name={_id} size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>Информации</span>
      {processID === _id && renderComponent()}
      {loading && <Loading />}
    </ProcessButton>
  )
};

export const Info = core.connect((state) => ({ processID: state.app.processID }))(_Info);
