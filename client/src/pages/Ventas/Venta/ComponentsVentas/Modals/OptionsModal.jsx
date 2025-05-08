import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { IoMdOptions } from 'react-icons/io';
import toast from 'react-hot-toast';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Checkbox } from "@heroui/react";
import { handleSunat } from '../../../Data/add_sunat';
import { handleSunatPDF } from '../../../Data/data_pdf';
import { handleUpdate } from '../../../Data/update_venta';

const OptionsModal = ({ modalOpen, closeModal, setConfirmDeleteModalOpen, refetchVentas }) => {
  const [sendToSunat, setSendToSunat] = useState(false);
  const [deleteOptionSelected, setDeleteOptionSelected] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isDeleted1, setIsDeleted1] = useState(false);
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

  const handleCheckboxChange = (option) => {
    if (option === 'sendToSunat') {
      // Toggle the current option state
      const newState = !sendToSunat;
      setSendToSunat(newState);
      // Only reset others if this one is being turned on
      if (newState) {
        setDeleteOptionSelected(false);
        setGeneratePdfSelected(false);
      }
    } else if (option === 'deleteOption') {
      const newState = !deleteOptionSelected;
      setDeleteOptionSelected(newState);
      if (newState) {
        setSendToSunat(false);
        setGeneratePdfSelected(false);
      }
    } else if (option === 'generatePdf') {
      const newState = !generatePdfSelected;
      setGeneratePdfSelected(newState);
      if (newState) {
        setSendToSunat(false);
        setDeleteOptionSelected(false);
      }
    }
  };

  const handleAccept = () => {
    if (sendToSunat) {
      if (sendToSunat && d_venta.tipoComprobante === 'Nota') {
        toast.error('Error, no se puede usar esta opción');
      } else {
        closeModal();
        handleSunat(datos_precio, detalles, detalles);
        handleUpdate(d_venta);
        setIsDeleted(true);
      }
    } else if (deleteOptionSelected) {
      handleDeleteVenta();
      setConfirmDeleteModalOpen(true);
      setIsDeleted1(true);
    } else if (generatePdfSelected) {
      if (generatePdfSelected && d_venta.tipoComprobante === 'Nota') {
        toast.error('Error, no se puede usar esta opción');
      } else {
        handleSunatPDF(d_venta, detalles);
      }
    }
  };

  useEffect(() => {
    if (isDeleted) {
      refetchVentas();
      setIsDeleted(false);
    }

    if (isDeleted1) {
      refetchVentas();
      setIsDeleted1(false);
    }
  }, [isDeleted, isDeleted1, refetchVentas]);

  const handleDeleteVenta = () => {
    // Lógica para eliminar la venta
  };

  return (
    <Modal 
      isOpen={modalOpen} 
      onClose={closeModal}
      placement="center"
      
    >
      <ModalContent className="bg-white rounded-lg">
        <ModalHeader className="flex items-center gap-2 border-b pb-2">
          <IoMdOptions className="text-xl" />
          <span>Opciones</span>
        </ModalHeader>
        
        <ModalBody className="py-4">
          <div className="grid space-y-4">
            <Checkbox
              isSelected={sendToSunat}
              onValueChange={() => handleCheckboxChange('sendToSunat')}
              isDisabled={d_venta.estado === 1 || d_venta.tipoComprobante === 'Nota'}
            >
              Enviar datos a la Sunat
            </Checkbox>
            
            <Checkbox
              isSelected={deleteOptionSelected}
              onValueChange={() => handleCheckboxChange('deleteOption')}
            >
              Eliminar la Venta
            </Checkbox>
            
            <Checkbox
              isSelected={generatePdfSelected}
              onValueChange={() => handleCheckboxChange('generatePdf')}
              isDisabled={d_venta.tipoComprobante === 'Nota'}
            >
              Generar PDF
            </Checkbox>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button color="default" variant="light" onPress={closeModal} className="mr-2">
            Cancelar
          </Button>
          <Button 
            color="success" 
            variant="shadow" 
            onPress={handleAccept} 
            isDisabled={(!deleteOptionSelected && !sendToSunat && !generatePdfSelected) || (sendToSunat && d_venta.estado === 1)}
          >
            Aceptar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

OptionsModal.propTypes = {
  modalOpen: PropTypes.bool.isRequired,
  closeModal: PropTypes.func.isRequired,
  setConfirmDeleteModalOpen: PropTypes.func.isRequired,
  refetchVentas: PropTypes.func.isRequired,
};

export default OptionsModal;
