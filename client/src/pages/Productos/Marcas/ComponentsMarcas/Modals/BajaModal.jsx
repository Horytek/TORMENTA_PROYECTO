import PropTypes from 'prop-types';
import { IoMdOptions } from 'react-icons/io';

const BajaModal = ({ modalOpen, toggleDeactivateMarca, handleDarBajaMarca, closeBajaModal }) => {
  if (!modalOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2 style={{ textAlign: "start" }}>
          <IoMdOptions className="inline-block mr-2" style={{ fontSize: '20px' }} />
          Opciones
        </h2>
        <div style={{ textAlign: "start" }}>
          <div className="flex mt-4" style={{ alignItems: "center" }}>
            <input
              type="checkbox"
              id="deactivate"
              className="custom-checkbox mr-2 relative"
              onChange={toggleDeactivateMarca}
            />
            <label htmlFor="deactivate">Dar de baja a la marca</label>
          </div>
        </div>
        <div className="modal-actions flex justify-end">
          <button className="btn btn-cancel" onClick={closeBajaModal}>
            Cancelar
          </button>
          <button className="btn btn-aceptar" onClick={handleDarBajaMarca}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

BajaModal.propTypes = {
  modalOpen: PropTypes.bool.isRequired,
  toggleDeactivateMarca: PropTypes.func.isRequired,
  closeModal: PropTypes.func.isRequired,
};

export default BajaModal;
