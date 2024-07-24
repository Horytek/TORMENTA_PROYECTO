import PropTypes from "prop-types";
import { IoMdOptions } from "react-icons/io";

const BajaModal = ({
  isBajaModalOpen,
  toggleDeactivateMarca,
  onConfirm,
  closeBajaModal,
}) => {
  if (!isBajaModalOpen) return null;
  
  return (
    <div className="bm-modal-content">
      <h2 style={{ textAlign: "start" }}>
        <IoMdOptions
          className="bm-inline-block bm-mr-2"
          style={{ fontSize: "20px" }}
        />
        Opciones
      </h2>
      <div style={{ textAlign: "start" }}>
        <div className="bm-flex bm-mt-4" style={{ alignItems: "center" }}>
          <input
            type="checkbox"
            id="deactivate"
            className="bm-custom-checkbox bm-mr-2 bm-relative"
            onChange={toggleDeactivateMarca}
          />
          <label htmlFor="deactivate">Dar de baja a la marca</label>
        </div>
      </div>
      <div className="bm-modal-actions bm-flex bm-justify-end" style={{ gap: "20px" , marginTop: "20px"}}>
        <button className="bm-btn bm-btn-cancel" onClick={closeBajaModal}>
          Cancelar
        </button>
        <button className="bm-btn bm-btn-aceptar" onClick={onConfirm}>
          Aceptar
        </button>
      </div>
    </div>
  );
};

BajaModal.propTypes = {
  isBajaModalOpen: PropTypes.bool.isRequired,
  toggleDeactivateMarca: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  closeBajaModal: PropTypes.func.isRequired
};

export default BajaModal;
