import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Toaster, toast } from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import {
  insertDestinatarioNatural,
  insertDestinatarioJuridico,
  updateDestinatarioNatural,
  updateDestinatarioJuridico
} from '@/services/destinatario.services';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button
} from "@heroui/react";

const DestinatariosForm = ({ modalTitle, onClose, initialData, onSuccess }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [documento, setDocumento] = useState(initialData?.documento || '');
  const [isDNI, setIsDNI] = useState(documento?.length === 8);
  const [isRUC, setIsRUC] = useState(documento?.length === 11);
  const isEditMode = !!initialData;

  const parseInitialData = () => {
    if (!initialData) return {};

    const result = {
      id: initialData.id,
      documento: initialData.documento,
      ubicacion: initialData.ubicacion || '',
      direccion: initialData.direccion || '',
      email: initialData.email || '',
      telefono: initialData.telefono || ''
    };

    if (initialData.documento?.length === 8) {
      const nameParts = initialData.destinatario?.split(' ') || [];
      result.nombre = nameParts[0] || '';
      result.apellidos = nameParts.slice(1).join(' ') || '';
    } else if (initialData.documento?.length === 11) {
      result.razonsocial = initialData.destinatario || '';
    }

    return result;
  };

  const parsedInitialData = parseInitialData();

  const handleDocumentoChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,11}$/.test(value)) {
      setDocumento(value);
      setIsDNI(value.length === 8);
      setIsRUC(value.length === 11);
      setValue('documento', value);
    }
  };

  const { control, handleSubmit, formState: { errors }, setValue, reset } = useForm({
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

  useEffect(() => {
    if (initialData) {
      const parsedData = parseInitialData();
      reset(parsedData);
    }
  }, [initialData, reset]);

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

      let result;
      let destinatarioResult = null;

      if (isEditMode) {
        if (documento.length === 8) {
          // Actualizar natural
          const destinatarioData = {
            dni: documento,
            nombres: nombre,
            apellidos,
            ubicacion,
            direccion,
            telefono,
            email
          };
          result = await updateDestinatarioNatural(initialData.id, destinatarioData);
          if (result) {
            destinatarioResult = {
              id: initialData.id,
              documento,
              destinatario: `${nombre} ${apellidos}`,
              ubicacion,
              direccion,
              telefono,
              email
            };
          }
        } else if (documento.length === 11) {
          // Actualizar jurídico
          const destinatarioData = {
            ruc: documento,
            razon_social: razonsocial,
            ubicacion,
            direccion,
            telefono,
            email
          };
          result = await updateDestinatarioJuridico(initialData.id, destinatarioData);
          if (result) {
            destinatarioResult = {
              id: initialData.id,
              documento,
              destinatario: razonsocial,
              ubicacion,
              direccion,
              telefono,
              email
            };
          }
        } else {
          toast.error("Documento inválido. Debe ser DNI (8 dígitos) o RUC (11 dígitos).");
          return;
        }
      } else {
        // Registro
        if (documento.length === 8) {
          const destinatarioData = {
            dni: documento,
            nombres: nombre,
            apellidos,
            ubicacion,
            direccion,
            telefono,
            email
          };
          result = await insertDestinatarioNatural(destinatarioData);
          if (result && result[0]) {
            destinatarioResult = {
              id: result[1],
              documento,
              destinatario: `${nombre} ${apellidos}`,
              ubicacion,
              direccion,
              telefono,
              email
            };
          }
        } else if (documento.length === 11) {
          const destinatarioData = {
            ruc: documento,
            razon_social: razonsocial,
            ubicacion,
            direccion,
            telefono,
            email
          };
          result = await insertDestinatarioJuridico(destinatarioData);
          if (result && result[0]) {
            destinatarioResult = {
              id: result[1],
              documento,
              destinatario: razonsocial,
              ubicacion,
              direccion,
              telefono,
              email
            };
          }
        } else {
          toast.error("Documento inválido. Debe ser DNI (8 dígitos) o RUC (11 dígitos).");
          return;
        }
      }

      if (destinatarioResult && (isEditMode ? result : result && result[0])) {
        toast.success("Destinatario guardado correctamente");
        if (onSuccess) onSuccess(destinatarioResult);
        handleCloseModal();
      }
    } catch (error) {
      toast.error("Error al gestionar el destinatario");
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
                      variant="flat"
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
                          variant="flat"
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
                          variant="flat"
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
                        variant="flat"
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
                        variant="flat"
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
                        variant="flat"
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
                      variant="flat"
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
                      variant="flat"
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
  initialData: PropTypes.object,
  onSuccess: PropTypes.func
};

export default DestinatariosForm;