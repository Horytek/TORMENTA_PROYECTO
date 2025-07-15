import { useState } from 'react';
import PropTypes from 'prop-types';
import { IoMdOptions } from 'react-icons/io';
import toast from 'react-hot-toast';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Checkbox } from "@heroui/react";
import { handleSunat } from '@/services/Data/add_sunat';
import { handleSunatPDF } from '@/services/Data/data_pdf';
import { handleUpdate } from '@/services/Data/update_venta';
import { useVentaSeleccionadaStore } from "@/store/useVentaTable";
import { useUserStore } from "@/store/useStore";

const OptionsModal = ({
  modalOpen,
  closeModal,
  setConfirmDeleteModalOpen,
  deleteOptionSelected,
  onDeleteVenta // Nueva prop para eliminar venta
}) => {
  const [sendToSunat, setSendToSunat] = useState(false);
  const [generatePdfSelected, setGeneratePdfSelected] = useState(false);

  // Zustand: obtener datos seleccionados
  const d_venta = useVentaSeleccionadaStore((state) => state.venta) || {};
  const detalles = useVentaSeleccionadaStore((state) => state.detalles) || [];
  const datos_precio = useVentaSeleccionadaStore((state) => state.venta) || {};


  // Rol desde Zustand
  const ver_rol = useUserStore((state) => state.rol);
  const nombre = useUserStore((state) => state.nombre);

  const handleCheckboxChange = (option) => {
    if (option === 'sendToSunat') {
      const newState = !sendToSunat;
      setSendToSunat(newState);
      if (newState) {
        setGeneratePdfSelected(false);
      }
    } else if (option === 'deleteOption') {
      // El control de deleteOptionSelected lo lleva el padre
      setConfirmDeleteModalOpen(true);
      closeModal();
    } else if (option === 'generatePdf') {
      const newState = !generatePdfSelected;
      setGeneratePdfSelected(newState);
      if (newState) {
        setSendToSunat(false);
      }
    }
  };

  const handleAccept = () => {
    if (sendToSunat) {
      if (d_venta.tipoComprobante === 'Nota') {
        toast.error('Error, no se puede usar esta opción');
      } else {
        closeModal();
        handleSunat(datos_precio, detalles, detalles);
        handleUpdate(d_venta);
      }
    } else if (generatePdfSelected) {
      if (d_venta.tipoComprobante === 'Nota') {
        toast.error('Error, no se puede usar esta opción');
      } else {
        handleSunatPDF(d_venta, detalles);
      }
    }
    // Eliminar venta se maneja por ConfirmationModal y onDeleteVenta
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
              isDisabled={d_venta.estado === "Aceptada" || d_venta.tipoComprobante === 'Nota' || ver_rol != 1}
            >
              Enviar datos a la Sunat
            </Checkbox>
            
            <Checkbox
              isSelected={deleteOptionSelected}
              onValueChange={() => handleCheckboxChange('deleteOption')}
              isDisabled={ver_rol != 1}
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
            isDisabled={(!sendToSunat && !generatePdfSelected) || (sendToSunat && d_venta.estado === "Aceptada")}
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
  deleteOptionSelected: PropTypes.bool.isRequired,
  onDeleteVenta: PropTypes.func // Nueva prop
};

export default OptionsModal;