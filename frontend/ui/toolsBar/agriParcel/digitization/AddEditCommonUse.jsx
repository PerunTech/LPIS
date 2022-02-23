import { React, Loading, elements } from "perun-core";
import { core, ui, data } from "../../../../Spatial";
import { decodeResponse, getFarmMapAssets, strcmp } from "../../../Util";
import { ProcessButton } from "../../ProcessButton";

const { Map, store, http, factory } = core;
const { geobuf, protobuf } = data;
const { Icon, Modal, Button, Form } = ui;
const { useReducer } = React;
const _id = "help";
const unit = factory.Polygon ? "m²" : "m";
const {useState} = React

/**
 * Create a crop parcel by selecting a single point.
 */
const _AddEditCommonUse = ({ processID, farmObjId }) => {
  const [{ layer, data, X, Y, loading, isGuided }, setState] = useReducer(
    (currState, update) => ({ ...currState, ...update }),
    { layer: {}, data: {}, X: 0, Y: 0, loading: false, isGuided: false }
  );

    const [stateArea, setStateArea] = useState("")
    const [stateLand, setStateLand] = useState("")

  const enable = () => {
    store.dispatch({ processID: _id });
    setState({ isGuided: false });

    // Click handler for selection of location and creation of crop parcel geometry.
    Map.on("click", (e) => {
      const p = Map.transform(e.latlng);
      setState({ X: p.x, Y: p.y, loading: true });

      http
        .call("get-parcel-info", {
          url: `/spatial/geometry/get/point/{init.token}/AGRI_PARCEL/${p.x}/${p.y}`,
          method: "get",
          responseType: "arraybuffer",
        })
        .then((response) => {
          setState({ loading: false });
          const data = geobuf.decode(protobuf(response));
          // filter data for type, set approp. config in factory.geoJSON
          const geojson = factory.geoJSON(data);
          const layers = geojson.getLayers();
          const jsonData = layers[0].feature.properties;
          const modalTitle = "";
          const area = `Површина: ${jsonData.AREA} ${unit}`;
          const land = `Класа: ${jsonData.LAND_COVER_CODE}`;

          setStateArea(area)
          setStateLand(land)

        //   elements.alertUser(
        //     true,
        //     "info",
        //     `Површина: ${jsonData.AREA} ${unit}`,
        //     `Класа: ${jsonData.LAND_COVER_CODE}`
        //   );
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

  const onSubmit = () => {
    disable();
  };

  const renderForm = () => {
    const jsonSchema = {
      title: "Add Edit Common Use",
      description: "Parcel Information.",
      type: "object",
      properties: {
        telephone: {
          type: "string",
          title: "Telephone",
          minLength: 10,
        },
      },
    };

    return (
      <Modal
        id="measure-dialog"
        show
        backdrop={false}
        enforceFocus={false}
        container={document.getElementsByClassName("control-map")[0]}
      >
        <Modal.Title></Modal.Title>
        <Modal.Body className="ap-modal-body">
            <span>{stateArea}</span>
            <span>{stateLand}</span>
          <Form
            schema={jsonSchema}
            // onChange={onChange}
            onSubmit={() => onSubmit()}
          >
            <div id="ss">
              <Button type="submit" size="" className="sss">
                Следно
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    );
  };

  return (
    <ProcessButton id={_id} onClick={enable}>
      <Icon name={_id} size="30px" />
      <span style={{ display: "block", marginTop: "5px" }}>
        Додади заедничка употреба
      </span>
      {processID === _id && renderForm()}
      {loading && <Loading />}
    </ProcessButton>
  );
};

export const AddEditCommonUse = core.connect((state) => ({
  processID: state.app.processID,
  mapId: state.map.id,
  farmObjId: state.farmRegistry?.farmObjId,
}))(_AddEditCommonUse);
