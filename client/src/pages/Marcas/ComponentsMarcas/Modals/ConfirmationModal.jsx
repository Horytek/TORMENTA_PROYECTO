import PropTypes from "prop-types";
import { IoMdOptions } from "react-icons/io";

const ConfirmationModal = ({
  confirmDeleteModalOpen,
  handleDeleteMarca,
  setConfirmDeleteModalOpen,
}) => {
  if (!confirmDeleteModalOpen) return null;

  return (
    <div className="modal-container">
      <div className="modal-content-c">
        <h2 style={{ textAlign: "start" }}>
          <IoMdOptions
            className="bm-inline-block bm-mr-2"
            style={{ fontSize: "20px" }}
          />
          Opciones
        </h2>
        <p style={{ textAlign: "start" }}>¿Desea eliminar esta marca?</p>
        <div
          className="cm-modal-actions cm-flex cm-justify-end"
          style={{ gap: "20px" }}
        >
          <button
            className="cm-btn cm-btn-cancel"
            onClick={() => setConfirmDeleteModalOpen(false)}
          >
            Cancelar
          </button>
          <button
            className="cm-btn cm-btn-danger"
            onClick={() => {
              if (typeof handleDeleteMarca === "function") {
                handleDeleteMarca();
                setConfirmDeleteModalOpen(false);
              } else {
                console.error("Ocurrió un error al eliminar la marca");
              }
            }}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmationModal.propTypes = {
  confirmDeleteModalOpen: PropTypes.bool.isRequired,
  handleDeleteMarca: PropTypes.func.isRequired,
  setConfirmDeleteModalOpen: PropTypes.func.isRequired,
};

export default ConfirmationModal;
