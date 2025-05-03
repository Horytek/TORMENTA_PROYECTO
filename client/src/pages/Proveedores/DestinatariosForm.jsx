import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Toaster, toast } from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { insertDestinatario, updateDestinatario } from '@/services/destinatario.services';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button
} from "@heroui/react";

const DestinatariosForm = ({ modalTitle, onClose, initialData }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [documento, setDocumento] = useState(initialData?.documento || '');
  const [isDNI, setIsDNI] = useState(documento?.length === 8);
  const [isRUC, setIsRUC] = useState(documento?.length === 11);
  const isEditMode = !!initialData;

  const parseInitialData = () => {
    if (!initialData) return {};

    const result = {
      documento: initialData.documento,
      ubicacion: initialData.ubicacion || '',
      direccion: initialData.direccion || '',
      email: initialData.email || '',
      telefono: initialData.telefono || ''
    };

    if (initialData.documento?.length === 8) {
      const nameParts = initialData.destinatario?.split(' ') || [];
      if (nameParts.length > 0) {
        result.nombre = nameParts[0];
        result.apellidos = nameParts.slice(1).join(' ');
      }
    } else if (initialData.documento?.length === 11) {
      // For RUC, use destinatario as razonsocial
      result.razonsocial = initialData.destinatario;
    }

    return result;
  };

  const parsedInitialData = parseInitialData();

  const handleDocumentoChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,11}$/.test(value)) { // Permitir solo números y máximo 11 dígitos
      setDocumento(value);
      setIsDNI(value.length === 8);
      setIsRUC(value.length === 11);
      setValue('documento', value);
    }
  };

  const { control, handleSubmit, formState: { errors }, setValue } = useForm({
    defaultValues: {
      documento: parsedInitialData.documento || '',
      nombre: parsedInitialData.nombre || '',
      apellidos: parsedInitialData.apellidos || '',
      razonsocial: parsedInitialData.razonsocial || '',
      ubicacion: parsedInitialData.ubicacion || '',
      direccion: parsedInitialData.direccion || '',
      email: parsedInitialData.email || '',
      telefono: parsedInitialData.telefono || ''
    }
  });

  // Helper function to check if a field is null/empty in edit mode
  const isFieldEmpty = (fieldName) => {
    if (!isEditMode) return false; // Not in edit mode, field should be editable

    const value = initialData[fieldName];
    return value === null || value === undefined || value === '';
  };

  useEffect(() => {
    if (initialData) {
      console.log("initialData recibida:", initialData);
      const parsedData = parseInitialData();

      setValue('documento', parsedData.documento || '');
      setValue('nombre', parsedData.nombre || '');
      setValue('apellidos', parsedData.apellidos || '');
      setValue('razonsocial', parsedData.razonsocial || '');
      setValue('ubicacion', parsedData.ubicacion || '');
      setValue('direccion', parsedData.direccion || '');
      setValue('email', parsedData.email || '');
      setValue('telefono', parsedData.telefono || '');
    }
  }, [initialData, setValue]);

  const onSubmit = async (data) => {
    try {
      const {
        documento,
        nombre,
        apellidos,
        razonsocial,
        ubicacion,
        direccion,
        email,
        telefono
      } = data;

      // Determine document type
      const tipo_doc = documento.length === 8 ? "DNI" : documento.length === 11 ? "RUC" : "Desconocido";
      const isDocumentoDNI = documento.length === 8;

      // Build backend-compatible object
      const destinatarioData = {
        // Use the appropriate fields based on document type
        dni: isDocumentoDNI ? documento : '',
        ruc: !isDocumentoDNI ? documento : '',
        nombres: isDocumentoDNI ? nombre : '',
        apellidos: isDocumentoDNI ? apellidos : '',
        razon_social: !isDocumentoDNI ? razonsocial : '',
        ubicacion,
        direccion,
        telefono,
        email
      };

      let result;
      if (initialData) {
        result = await updateDestinatario(initialData.id, destinatarioData);
      } else {
        result = await insertDestinatario(destinatarioData);
      }

      if (result) {
        toast.success("Destinatario guardado correctamente");
        handleCloseModal();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      toast.error("Error al gestionar el destinatario");
      console.error(error);
    }
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <>
      <Toaster />
      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        size="2xl"
        
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {modalTitle}
              </ModalHeader>
              <ModalBody>
                <Controller
                  name="documento"
                  control={control}
                  rules={{ required: "Documento requerido (8-11 dígitos)", minLength: 8, maxLength: 11 }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Documento"
                      variant="bordered"
                      value={documento}
                      onChange={handleDocumentoChange}
                      color={errors.documento ? "danger" : "default"}
                      errorMessage={errors.documento?.message}
                      isRequired
                    />
                  )}
                />

                {isDNI && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <Controller
                      name="nombre"
                      control={control}
                      rules={{ required: isDNI ? "Nombre requerido" : false }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          label="Nombre"
                          variant="bordered"
                          isDisabled={isEditMode && !parsedInitialData.nombre}
                          placeholder={isEditMode && !parsedInitialData.nombre ? "No hay datos disponibles" : ""}
                          color={errors.nombre ? "danger" : "default"}
                          errorMessage={errors.nombre?.message}
                          isRequired={isDNI}
                        />
                      )}
                    />

                    <Controller
                      name="apellidos"
                      control={control}
                      rules={{ required: isDNI ? "Apellidos requeridos" : false }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          label="Apellidos"
                          variant="bordered"
                          isDisabled={isEditMode && !parsedInitialData.apellidos}
                          placeholder={isEditMode && !parsedInitialData.apellidos ? "No hay datos disponibles" : ""}
                          color={errors.apellidos ? "danger" : "default"}
                          errorMessage={errors.apellidos?.message}
                          isRequired={isDNI}
                        />
                      )}
                    />
                  </div>
                )}

                {isRUC && (
                  <Controller
                    name="razonsocial"
                    control={control}
                    rules={{ required: isRUC ? "Razón Social requerida" : false }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Razón Social"
                        variant="bordered"
                        isDisabled={isEditMode && !parsedInitialData.razonsocial}
                        placeholder={isEditMode && !parsedInitialData.razonsocial ? "No hay datos disponibles" : ""}
                        color={errors.razonsocial ? "danger" : "default"}
                        errorMessage={errors.razonsocial?.message}
                        className="mt-2"
                        isRequired={isRUC}
                      />
                    )}
                  />
                )}

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Controller
                    name="telefono"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Teléfono"
                        variant="bordered"
                        isDisabled={isEditMode && !initialData.telefono}
                        placeholder={isEditMode && !initialData.telefono ? "No hay datos disponibles" : ""}
                        color={errors.telefono ? "danger" : "default"}
                        errorMessage={errors.telefono?.message}
                      />
                    )}
                  />

                  <Controller
                    name="ubicacion"
                    control={control}
                    rules={{ required: "Ubicación requerida" }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Ubicación"
                        variant="bordered"
                        isDisabled={isEditMode && !initialData.ubicacion}
                        placeholder={isEditMode && !initialData.ubicacion ? "No hay datos disponibles" : ""}
                        color={errors.ubicacion ? "danger" : "default"}
                        errorMessage={errors.ubicacion?.message}
                        isRequired
                      />
                    )}
                  />
                </div>

                <Controller
                  name="direccion"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Dirección"
                      variant="bordered"
                      isDisabled={isEditMode && !initialData.direccion}
                      placeholder={isEditMode && !initialData.direccion ? "No hay datos disponibles" : ""}
                      color={errors.direccion ? "danger" : "default"}
                      errorMessage={errors.direccion?.message}
                      className="mt-2"
                    />
                  )}
                />

                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Email"
                      type="email"
                      variant="bordered"
                      isDisabled={isEditMode && !initialData.email}
                      placeholder={isEditMode && !initialData.email ? "No hay datos disponibles" : ""}
                      color={errors.email ? "danger" : "default"}
                      errorMessage={errors.email?.message}
                      className="mt-2"
                    />
                  )}
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={handleCloseModal}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={handleSubmit(onSubmit)}
                >
                  Guardar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

DestinatariosForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.object
};

export default DestinatariosForm;