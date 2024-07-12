import PropTypes from "prop-types";
import { IoMdOptions } from "react-icons/io";

const ConfirmationModal = ({
  confirmDeleteModalOpen,
  handleDeleteVenta,
  setConfirmDeleteModalOpen,
}) => {
  if (!confirmDeleteModalOpen) return null;

  return (
    <div className="modal-content">
      <h2 style={{ textAlign: "start" }}>
        <IoMdOptions
          className="inline-block mr-2"
          style={{ fontSize: "20px" }}
        />
        Opciones
      </h2>
      <p style={{ textAlign: "start" }}>¿Desea eliminar esta marca?</p>
      <div className="modal-actions flex justify-end" style={{ gap: "20px" }}>
        <button
          className="btn btn-cancel"
          onClick={() => setConfirmDeleteModalOpen(false)}
        >
          Cancelar
        </button>
        <button className="btn btn-danger" onClick={handleDeleteVenta}>
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
  closeModal: PropTypes.func.isRequired,
};

export default ConfirmationModal;
