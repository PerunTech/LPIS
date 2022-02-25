import { React, Loading, elements } from "perun-core";
import { core, ui, data } from "../../../../Spatial";
import { decodeResponse, getFarmMapAssets, strcmp } from "../../../Util";
import { ProcessButton } from "../../ProcessButton";
import { SimpleForm } from "./SimpleForm"
import { GuideForm } from '../GuideForm';
import { Form } from '../Form';
const { Map, store, http, factory } = core;
const { geobuf, protobuf } = data;

const { Icon, DrawActions } = ui;
const { useReducer } = React;
const _id = "common-use";
const unit = factory.Polygon ? "m²" : "m";
const { useState } = React

const jsonSchema =
{
  "type": "object",
  "title": "Внеси заедничка употреба",
  "properties": {
    "numberEnumRadio": {
      "type": "string",
      "title": "Одбери тип на дел:",
      "enum": [
        "Површина",
        "Идеален дел"
      ]
    },
    "Area": {
      "type": "string",
      "title": "Вредност"
    }
  }

};

const uiSchema =
{

  "numberEnumRadio": {
    "ui:widget": "radio",
    "ui:options": {
      "inline": true
    }
  },
};

/**
 * Create a crop parcel by selecting a single point.
 */
const _AddEditCommonUse = ({ processID, farmObjId }) => {
  const [{ layer, data, X, Y, loading, isGuided }, setState] = useReducer(
    (currState, update) => ({ ...currState, ...update }),
    { layer: {}, data: {}, X: 0, Y: 0, loading: false, isGuided: false }
  );

  const [stateArea, setStateArea] = useState("");
  const [stateLand, setStateLand] = useState("");

  const enable = () => {
    store.dispatch({ processID: _id });
    setState({ isGuided: true });

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
          //const data = geobuf.decode(protobuf(response));
          // filter data for type, set approp. config in factory.geoJSON
          const geojson = factory.geoJSON(data);
          const layers = geojson.getLayers();
          const jsonData = layers[0].feature.properties;
          const modalTitle = "";
          const area = `Површина: ${jsonData.AREA} ${unit}`;
          const land = `Класа: ${jsonData.LAND_COVER_CODE}`;

          data = JSON.stringify({
            ...layer.feature.properties,
            OBJECT_ID: Number(layer.feature.id),
            OBJECT_TYPE: Number(layer.feature.properties.type)
          })

          setStateArea(area)
          setStateLand(land)

          setState({
            layer: {},
            data: {},
            X: 0,
            Y: 0,
            loading: false,
            isGuided: false,
          });
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
          isGuided: false,
        });
        store.dispatch({ processID: "" });
        // We remove the working geometry, save process will add the result.
        layer.removeFrom && layer.removeFrom(Map);
        getFarmMapAssets();
      }
    }
  };

  const onSubmit = ({ formData }) => {
    http
      .call("submit-common-use", {
        url: `/lpis/save/commonUse/{token}/{objectId}/{parentId}`,
        method: "post",
        data: JSON.stringify(formData),
        responseType: "json",
      })
      .then((response) => {

        setState({
          layer: {},
          data: {},
          X: 0,
          Y: 0,
          loading: false,
          isGuided: false,
        });
        elements.alertUser(
          true,
          "success",
          "Успешно регистрирање заедничка употреба",
          "Успешно регистрирање заедничка употреба"
        );
      })
      .catch((err) => {
        console.log(err);
        elements.alertUser(true, "error", "Настана грешка");

        disable();
      });

    Map.off("click");
    disable();
  };


  const onChange = ({ formData }) => {
    setState({ data: { ...data, ...formData } });
  }


  const renderGuideForm = () => {
    return <GuideForm id={_id}
      disable={disable}
      title='Одбери парцела'
    />
  }

  const renderForm2 = () => {
    if (!isGuided)
      return (
        <Form onSubmit={onSubmit} formData={data} onChange={onChange} schema={jsonSchema} uiSchema={uiSchema} isSimple='true'>
          <DrawActions cancel={disable} />
        </Form>
      )
    else
      return renderGuideForm();

  }



  return (
    <ProcessButton id={_id} onClick={enable}>
      <Icon name={_id} size="30px" />
      <span style={{ display: "block", marginTop: "5px" }}>
        Додади заедничка употреба
      </span>
      {processID === _id && renderForm2()}
      {loading && <Loading />}
    </ProcessButton>
  );
};

export const AddEditCommonUse = core.connect((state) => ({
  processID: state.app.processID,
  mapId: state.map.id,
  farmObjId: state.farmRegistry?.farmObjId,
}))(_AddEditCommonUse);
