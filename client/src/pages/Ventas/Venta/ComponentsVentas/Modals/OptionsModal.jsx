import { useState,useEffect } from 'react';
import PropTypes from 'prop-types';
import { IoMdOptions } from 'react-icons/io';
//import toast from 'react-hot-toast';
import {  handleSunat } from '../../../Data/add_sunat';
import {  handleSunatPDF } from '../../../Data/data_pdf';
import {  handleUpdate } from '../../../Data/update_venta';

const OptionsModal = ({ modalOpen, closeModal, setConfirmDeleteModalOpen, refetchVentas }) => {
  const [sendToSunat, setSendToSunat] = useState(false);
  const [deleteOptionSelected, setDeleteOptionSelected] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [generatePdfSelected, setGeneratePdfSelected] = useState(false);
  const loadDetallesFromLocalStorage2 = () => {
    const savedDetalles = localStorage.getItem('ventas');
    return savedDetalles ? JSON.parse(savedDetalles) : [];
  };

  const d_venta = loadDetallesFromLocalStorage2();

  const loadDetallesFromLocalStorage = () => {
    const savedDetalles = localStorage.getItem('new_detalle');
    return savedDetalles ? JSON.parse(savedDetalles) : [];
};
const detalles = loadDetallesFromLocalStorage();

const loadDetallesFromLocalStorage1 = () => {
  const savedDetalles = localStorage.getItem('ventas');
  return savedDetalles ? JSON.parse(savedDetalles) : [];
};
const datos_precio = loadDetallesFromLocalStorage1();

/*const loadDetallesFromLocalStorage2 = () => {
  const savedDetalles = localStorage.getItem('datosClientes');
  return savedDetalles ? JSON.parse(savedDetalles) : [];
};
const datosClientes = loadDetallesFromLocalStorage2();*/

const handleCheckboxChange = (option) => {
  if (option === 'sendToSunat') {
    setSendToSunat(true);
    setDeleteOptionSelected(false);
    setGeneratePdfSelected(false);
  } else if (option === 'deleteOption') {
    setSendToSunat(false);
    setDeleteOptionSelected(true);
    setGeneratePdfSelected(false);
  } else if (option === 'generatePdf') {
    setSendToSunat(false);
    setDeleteOptionSelected(false);
    setGeneratePdfSelected(true);
  }
};

const handleAccept = () => {
  if (sendToSunat) {
    closeModal();
    handleSunat(datos_precio, detalles, detalles);
    handleUpdate(d_venta);
    setTimeout(() => {
      setIsDeleted(true);
    }, 3000);
  } else if (deleteOptionSelected) {
    handleDeleteVenta();
    setConfirmDeleteModalOpen(true);
  } else if (generatePdfSelected) {
    handleSunatPDF(d_venta,detalles);
  }
};

  useEffect(() => {
    if (isDeleted) {
      refetchVentas();
      setIsDeleted(false);
    }
  }, [isDeleted, refetchVentas]);

  const handleDeleteVenta = () => {
    // Agrega aquí la lógica para eliminar la venta
    console.log('Eliminando la venta...');
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
              onChange={() => handleCheckboxChange('sendToSunat')}
              checked={sendToSunat}
              disabled={d_venta.estado===1 || d_venta.tipoComprobante === 'Nota'}
            />{' '}
            <p>Enviar los datos a la Sunat</p>
          </div>
          <div className="flex mt-4" style={{ alignItems: "center" }}>
            <input
              type="checkbox"
              id="eliminar"
              className="custom-checkbox mr-2 relative"
              onChange={() => handleCheckboxChange('deleteOption')}
              checked={deleteOptionSelected}
            />{' '}
            <p>Eliminar la Venta</p>
          </div>
          <div className="flex mt-4" style={{ alignItems: "center" }}>
            <input
              type="checkbox"
              id="eliminar"
              className="custom-checkbox mr-2 relative"
              onChange={() => handleCheckboxChange('generatePdf')}
              checked={generatePdfSelected}
              disabled={d_venta.tipoComprobante === 'Nota'}
            />{' '}
            <p>Generar PDF</p>
          </div>
        </div>
        <div className="modal-actions flex justify-end">
          <button className="btn btn-cancel" onClick={closeModal}>
            Cancelar
          </button>
          <button className="btn btn-aceptar" onClick={handleAccept} disabled={(!deleteOptionSelected && !sendToSunat && !generatePdfSelected) || (sendToSunat && d_venta.estado===1) || (sendToSunat && d_venta.tipoComprobante === 'Nota') || (generatePdfSelected && d_venta.tipoComprobante === 'Nota')}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

OptionsModal.propTypes = {
  modalOpen: PropTypes.bool.isRequired,
  closeModal: PropTypes.func.isRequired,
  setConfirmDeleteModalOpen: PropTypes.func.isRequired,
  deleteOptionSelected: PropTypes.bool.isRequired,
  refetchVentas: PropTypes.func.isRequired,
};

export default OptionsModal;
