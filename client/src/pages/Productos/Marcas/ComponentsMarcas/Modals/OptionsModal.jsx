import PropTypes from 'prop-types';
import { IoMdOptions } from 'react-icons/io';

const OptionsModal = ({ modalOpen, toggleDeleteDetalleOption, closeModal, setConfirmDeleteModalOpen, deleteOptionSelected }) => {
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
              id="eliminar"
              className="custom-checkbox mr-2 relative"
              onChange={toggleDeleteDetalleOption}
            />{' '}
            <p>
              Eliminar la Marca
            </p>
          </div>
        </div>
        {/* Otros checkboxes y acciones */}
        <div className="modal-actions flex justify-end">
          <button className="btn btn-cancel" onClick={closeModal}>
            Cancelar
          </button>
          <button className="btn btn-aceptar" onClick={() => setConfirmDeleteModalOpen(true)} disabled={!deleteOptionSelected}>
            Aceptar
          </button>
        </div>
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
