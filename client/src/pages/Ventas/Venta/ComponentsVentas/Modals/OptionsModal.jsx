import { useState } from 'react';
import PropTypes from 'prop-types';
import { IoMdOptions } from 'react-icons/io';
import toast from 'react-hot-toast';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Checkbox } from "@heroui/react";
import { handleSunat, handleSunatPDF, handleUpdate } from "@/services/ventas.services";
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
        handleSunat(datos_precio, detalles, detalles, nombre);
        handleUpdate(d_venta);
      }
    } else if (generatePdfSelected) {
      if (d_venta.tipoComprobante === 'Nota') {
        toast.error('Error, no se puede usar esta opción');
      } else {
        handleSunatPDF(d_venta, detalles, nombre);
      }
    }
    // Eliminar venta se maneja por ConfirmationModal y onDeleteVenta
  };

  return (
    <Modal
      isOpen={modalOpen}
      onClose={closeModal}
      backdrop="opaque"
      motionProps={{
        variants: {
          enter: { y: 0, opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
          exit: { y: -20, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
        }
      }}
      classNames={{ backdrop: "bg-[#27272A]/10 backdrop-opacity-4" }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <IoMdOptions className="text-xl" />
                <span>Opciones Avanzadas</span>
              </div>
            </ModalHeader>

            <ModalBody>
              <div className="flex flex-col gap-3">
                <Checkbox
                  isSelected={sendToSunat}
                  onValueChange={() => handleCheckboxChange('sendToSunat')}
                  isDisabled={d_venta.estado === "Aceptada" || d_venta.tipoComprobante === 'Nota' || ver_rol != 1}
                  color="primary"
                >
                  Enviar datos a la Sunat
                </Checkbox>

                <Checkbox
                  isSelected={deleteOptionSelected}
                  onValueChange={() => handleCheckboxChange('deleteOption')}
                  isDisabled={ver_rol != 1}
                  color="danger"
                >
                  Eliminar la Venta
                </Checkbox>

                <Checkbox
                  isSelected={generatePdfSelected}
                  onValueChange={() => handleCheckboxChange('generatePdf')}
                  isDisabled={d_venta.tipoComprobante === 'Nota'}
                  color="secondary"
                >
                  Generar PDF
                </Checkbox>
              </div>
            </ModalBody>

            <ModalFooter>
              <Button color="danger" variant="shadow" onPress={onClose}>
                Cancelar
              </Button>
              <Button
                color="primary"
                variant="shadow"
                onPress={handleAccept}
                isDisabled={(!sendToSunat && !generatePdfSelected) || (sendToSunat && d_venta.estado === "Aceptada")}
              >
                Aceptar
              </Button>
            </ModalFooter>
          </>
        )}
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