import { React, Loading, elements } from "perun-core";
import { core, ui, data } from "../../../../Spatial";
import { decodeResponse, getFarmMapAssets, strcmp } from "../../../Util";
import { ProcessButton } from "../../ProcessButton";

const { Map, store, http } = core;
const { Icon } = ui;
const { useReducer } = React;
const _id = "help";

const _GetParcelInfo = ({ processID, farmObjId }) => {
  const [{ layer, data, X, Y, loading, isGuided }, setState] = useReducer(
    (currState, update) => ({ ...currState, ...update }),
    { layer: {}, data: {}, X: 0, Y: 0, loading: false, isGuided: false }
  );

  const enable = () => {
    store.dispatch({ processID: _id });
    setState({ isGuided: false });

    // Click handler for selection of location and creation of crop parcel geometry.
    Map.on("click", (e) => {
      const p = Map.transform(e.latlng);
      setState({ X: p.x, Y: p.y, loading: true });

      http
        .call("get-parcel-info", {
          url: `/spatial/geometry/info/{init.token}/AGRI_PARCEL/${p.x}/${p.y}`,
          method: "get",
        })
        .then((response) => {
          setState({ loading: false });
          elements.alertUser(
            true,
            "info",
            `Име: ${response.data.items[0].FULL_NAME}`,
            `ИДБР: ${response.data.items[0].FIC}`
          );

          disable();
        })
        .catch((err) => {
          console.log(err);
          elements.alertUser(true, "error", "Настана грешка");

          disable();
        });

      Map.off("click");
    });
  };

  const errorHandler = () => {
    setState({ loading: true });
    console.log("dashnasd");
  };

  const disable = (responseType, response, isLoading) => {
    if (isLoading) {
      setState({ loading: true });
    } else {
      setState({ loading: false });
      if (strcmp(responseType, "error")) {
        const errorMsg = decodeResponse(response);
        elements.alertUser(true, "error", "Грешка при зачувување", errorMsg);
        errorHandler();
      } else {
        Map.off("click");
        // Reset state, internal and application-wide.
        setState({
          layer: {},
          data: {},
          X: 0,
          Y: 0,
          loading: false,
          enumIdx: [],
          enumNames: [],
          isGuided: false,
        });
        store.dispatch({ processID: "" });
        // We remove the working geometry, save process will add the result.
        layer.removeFrom && layer.removeFrom(Map);
        getFarmMapAssets();
      }
    }
  };

  return (
    <ProcessButton id={_id} onClick={enable}>
      <Icon name={_id} size="30px" />
      <span style={{ display: "block", marginTop: "5px" }}>Информации за парцела</span>
      {loading && <Loading />}
    </ProcessButton>
  );
};

export const GetParcelInfo = core.connect((state) => ({
  processID: state.app.processID,
  mapId: state.map.id,
  farmObjId: state.farmRegistry?.farmObjId,
}))(_GetParcelInfo);
