import PropTypes from "prop-types";
import { IoMdOptions } from "react-icons/io";

const OptionsModal = ({
  modalOpen,
  toggleDeleteDetalleOption,
  closeModal,
  setConfirmDeleteModalOpen,
  deleteOptionSelected,
}) => {
  if (!modalOpen) return null;

  return (
    <div className="om-modal-content-c">
      <h2 style={{ textAlign: "start" }}>
        <IoMdOptions
          className="om-inline-block om-mr-2"
          style={{ fontSize: "20px" }}
        />
        Opciones
      </h2>
      <div style={{ textAlign: "start" }}>
        <div className="om-flex om-mt-4" style={{ alignItems: "center" }}>
          <input
            type="checkbox"
            id="eliminar"
            className="om-custom-checkbox om-mr-2 om-relative"
            onChange={toggleDeleteDetalleOption}
          />
          <label htmlFor="eliminar" className="om-label">
            Eliminar la Marca
          </label>
        </div>
      </div>
      {/* Otros checkboxes y acciones */}
      <div
        className="om-modal-actions om-flex om-justify-end"
        style={{ gap: "20px" }}
      >
        <button className="om-btn om-btn-cancel" onClick={closeModal}>
          Cancelar
        </button>
        <button
          className="om-btn om-btn-aceptar"
          onClick={() => setConfirmDeleteModalOpen(true)}
          disabled={!deleteOptionSelected}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
};

OptionsModal.propTypes = {
  modalOpen: PropTypes.bool.isRequired,
  toggleDeleteDetalleOption: PropTypes.func.isRequired,
  closeModal: PropTypes.func.isRequired,
  setConfirmDeleteModalOpen: PropTypes.func.isRequired,
  deleteOptionSelected: PropTypes.bool.isRequired,
};

export default OptionsModal;
