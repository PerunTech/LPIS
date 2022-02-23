import { React, elements } from "perun-core";
import { core, ui } from "../../../../Spatial";
import { deleteAPFromFarmMsg } from "../Config";
import { getFarmMapAssets } from "../../../Util";
import { Guidance } from "../Guidance";
import { ProcessButton } from "../../ProcessButton";

const { store, http } = core;
const { Button, Icon, DrawActions, Modal } = ui;
const { useReducer } = React;
const _id = "deleteAP";
const _processID = "deleteAPFromFarm"

const _DeleteParcelFromFarm = ({ processID, farmObjId, farmObjectTypeId }) => {
  const [{ isGuided, layer }, setState] = useReducer(
    (currState, update) => ({ ...currState, ...update }),
    { isGuided: false, layer: {} }
  );

  const deleteLayer = () => {
    http.call("delete-farm", {
      url: '/lpis/remove/farm/{init.token}/' + layer.feature.id + '/AGRI_PARCEL',
      method: "get",
    })
      .then(() => {
        //console.log(response);
        elements.alertUser(
          true,
          "success",
          "Успешно бришење",
          "Парцелата е отстранета од фармата."
        );
        disable();
      })
      .catch((err) => {
        //console.log(err);
        elements.alertUser(
          true,
          "error",
          "Грешка при бришење",
          "Парцелата не е избришана од базата на податоци."
        );
        disable();
      });
  };

  const enable = () => {
    const layers = Object.values(store.getState().farmRegistry?.agriParcels);

    if (layers.length > 0) {
      store.dispatch({ processID: _processID });
      setState({ isGuided: true });

      layers.forEach((sc) => {
        sc.bringToFront();
        sc.on("click", function (e) {
          setState({ layer: e.target, isGuided: false });
        });
      });
    } else {
      elements.alertUser(
        true,
        "warning",
        "Не се пронајдени парцели.",
        "Додадете парцели пред да ја користите алатката за бришење."
      );
    }
  };

  const disable = () => {
    // Reset state, internal and application-wide.
    store.dispatch({ processID: "" });
    setState({ isGuided: false, layer: {} });
    getFarmMapAssets();
  };

  return (
    <ProcessButton id={_processID} onClick={() => enable()}>
      <Icon name={_id} size="30px" />
      <span style={{ display: "block", marginTop: "5px" }}>
        Отстрани парцела од фарма
      </span>
      {processID === _processID &&
        (isGuided ? (
          <Guidance
            id={_processID}
            disable={disable}
            msg={deleteAPFromFarmMsg}
            title="Отстрани парцела од фарма"
          />
        ) : (
          <Modal
            id="measure-dialog"
            className="delete-control-dialog"
            show
            backdrop={false}
            enforceFocus={false}
            container={document.getElementsByClassName("control-map")[0]}
          >
            <Modal.Title>
              <Button disabled className="as-label ap-modal-title">
                Отстрани парцела од фарма
              </Button>
              <DrawActions cancel={disable} />
            </Modal.Title>
            <Modal.Body className="ap-modal-body">
              <div id={_id}>
                {"Ја избравте парцелата со СИЗП број " +
                  layer.feature.id +
                  " и површина " +
                  Math.round(layer.getMeasurement()) +
                  " m². Дали сте сигурни дека сакате да ја отстраните од фармата?"}
              </div>
              <Button
                onClick={() => {
                  deleteLayer();
                }}
                size=""
                className="cancel"
              >
                {" "}
                Отстрани
              </Button>
            </Modal.Body>
          </Modal>
        ))}
    </ProcessButton>
  );
};

export const DeleteParcelFromFarm = core.connect((state) => ({
  processID: state.app.processID,
  mapId: state.map.id,
  farmObjId: state.farmRegistry?.farmObjId,
  farmObjectTypeId: state.farmRegistry?.farmObjTypeId,
}))(_DeleteParcelFromFarm);
