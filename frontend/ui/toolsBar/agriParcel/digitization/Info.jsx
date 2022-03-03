import { React, Loading, elements } from 'perun-core';
import { core, ui } from '../../../../Spatial';
import { parcelInfoMsg } from '../Config';
import { ProcessButton } from '../../ProcessButton';
import { Guidance } from '../Guidance';

const { Map, store, http } = core;
const { Icon } = ui;
const { alertUser } = elements;
const { useReducer } = React;
const _id = 'help';

const _Info = ({ processID }) => {
  const [{ loading }, setState] = useReducer((currState, update) => ({ ...currState, ...update }), { loading: false });

  const enable = () => {
    store.dispatch({ processID: _id });
    Map.on('click', (e) => {
      const p = Map.transform(e.latlng);
      setState({ X: p.x, Y: p.y, loading: true });
      const url = `/spatial/geometry/info/{init.token}/AGRI_PARCEL/${p.x}/${p.y}`
      http.call('get-parcel-info', { url }).then((response) => {
        setState({ loading: false });
        alertUser(true, 'info',
          `Целосно име: ${response.data.items[0].FULL_NAME}`,
          `ИДБР: ${response.data.items[0].FIC}`,
          () => disable()
        );
      }).catch((err) => {
        console.log(err);
        alertUser(true, 'info', 'Нема податоци за избраната парцела', 'Или не е избрана парцела од мапата', () => disable());
      });

      Map.off('click');
    });
  };

  const disable = () => {
    Map.off('click');
    // Reset state, internal and application-wide.
    setState({ loading: false });
    store.dispatch({ processID: '' });
  };

  return (
    <ProcessButton id={_id} onClick={enable}>
      <Icon name={_id} size='30px' />
      <span style={{ display: 'block', marginTop: '5px' }}>Информации за парцела</span>
      {processID === _id && <Guidance id={_id} disable={disable} msg={parcelInfoMsg} title='Информации за парцела' />}
      {loading && <Loading />}
    </ProcessButton>
  );
};

export const Info = core.connect((state) => ({ processID: state.app.processID }))(_Info);
