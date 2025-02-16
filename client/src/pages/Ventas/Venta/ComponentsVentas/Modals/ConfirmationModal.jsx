import PropTypes from 'prop-types';
import { IoMdOptions } from 'react-icons/io';
import { Button } from "@nextui-org/react";



const ConfirmationModal = ({ confirmDeleteModalOpen, handleDeleteVenta, setConfirmDeleteModalOpen }) => {

  if (!confirmDeleteModalOpen) return null;

  return (
    <div className="modal-container">
      <div className="modal-content-c">
        <h2 style={{ textAlign: "start" }}>
          <IoMdOptions className="inline-block mr-2" style={{ fontSize: '20px' }} />
          Opciones
        </h2>
        <p style={{ textAlign: "start" }}>¿Desea eliminar esta venta?</p>
        <div className="modal-actions flex justify-end">
          <Button color="default" variant="shadow" onClick={() => setConfirmDeleteModalOpen(false)} className="mr-2">
            Cancelar
          </Button>
          <Button color="danger" variant="shadow" onClick={handleDeleteVenta}>
            Eliminar
          </Button>
        </div>
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
