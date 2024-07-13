import PropTypes from "prop-types";
import { IoMdOptions } from "react-icons/io";

const ConfirmationModal = ({
  confirmDeleteModalOpen,
  handleDeleteVenta,
  setConfirmDeleteModalOpen,
}) => {
  if (!confirmDeleteModalOpen) return null;

  return (
    <div className="cm-modal-content">
      <h2 style={{ textAlign: "start" }}>
        <IoMdOptions
          className="cm-inline-block cm-mr-2"
          style={{ fontSize: "20px" }}
        />
        Opciones
      </h2>
      <p style={{ textAlign: "start" }}>¿Desea eliminar esta marca?</p>
      <div className="cm-modal-actions cm-flex cm-justify-end" style={{ gap: "20px" }}>
        <button
          className="cm-btn cm-btn-cancel"
          onClick={() => setConfirmDeleteModalOpen(false)}
        >
          Cancelar
        </button>
        <button className="cm-btn cm-btn-danger" onClick={handleDeleteVenta}>
          Eliminar
        </button>
      </div>
    </div>
  );
};

ConfirmationModal.propTypes = {
  confirmDeleteModalOpen: PropTypes.bool.isRequired,
  handleDeleteVenta: PropTypes.func.isRequired,
  setConfirmDeleteModalOpen: PropTypes.func.isRequired,
};

export default ConfirmationModal;
