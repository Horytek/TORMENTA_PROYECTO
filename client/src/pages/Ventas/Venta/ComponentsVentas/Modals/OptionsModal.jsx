import { useState } from 'react';
import PropTypes from 'prop-types';
import { IoMdOptions } from 'react-icons/io';
import toast from 'react-hot-toast';

const OptionsModal = ({ modalOpen, toggleDeleteDetalleOption, closeModal, setConfirmDeleteModalOpen, deleteOptionSelected }) => {
  const [sendToSunat, setSendToSunat] = useState(false);

  // Maneja el cambio del checkbox "Enviar datos a la Sunat"
  const handleSendToSunatChange = () => {
    if (sendToSunat) {
      setSendToSunat(false);
    } else if (!sendToSunat) {
      setSendToSunat(true);
      //toggleDeleteDetalleOption(false); // Deselecciona el checkbox de "Eliminar la Venta"
    } 
  };

  // Maneja el cambio del checkbox "Eliminar la Venta"
  const handleDeleteOptionChange = () => {
    if (deleteOptionSelected) {
      toggleDeleteDetalleOption(false);
    } else if (!deleteOptionSelected) {
      toggleDeleteDetalleOption(true);
      //setSendToSunat(false); // Deselecciona el checkbox de "Enviar datos a la Sunat"
    }
  };

  // Maneja el clic en el botón "Aceptar"
  const handleAccept = () => {
    if (sendToSunat) {
      closeModal();
      const loadingToastId = toast.loading('Se están enviando los datos a la Sunat...');
      setTimeout(() => {
        toast.dismiss(loadingToastId);
        toast.success('Los datos se han enviado con éxito!');
      }, 3000);
    } else if (deleteOptionSelected) {
      setConfirmDeleteModalOpen(true);
    }
  };


  if (!modalOpen) return null;

  return (
    <div className="modal-container">
      <div className="modal-content-c">
        <h2 style={{ textAlign: "start" }}>
          <IoMdOptions className="inline-block mr-2" style={{ fontSize: '20px' }} />
          Opciones
        </h2>
        <div style={{ textAlign: "start" }}>
          <div className="flex mt-4" style={{ alignItems: "center" }}>
            <input
              type="checkbox"
              id="sendToSunat"
              className="custom-checkbox mr-2 relative"
              onChange={handleSendToSunatChange}
              checked={sendToSunat}
            />{' '}
            <p>Enviar los datos a la Sunat</p>
          </div>
          <div className="flex mt-4" style={{ alignItems: "center" }}>
            <input
              type="checkbox"
              id="eliminar"
              className="custom-checkbox mr-2 relative"
              onChange={handleDeleteOptionChange}
              checked={deleteOptionSelected}
            />{' '}
            <p>Eliminar la Venta</p>
          </div>
        </div>
        <div className="modal-actions flex justify-end">
          <button className="btn btn-cancel" onClick={closeModal}>
            Cancelar
          </button>
          <button className="btn btn-aceptar" onClick={handleAccept} disabled={!deleteOptionSelected && !sendToSunat}>
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
