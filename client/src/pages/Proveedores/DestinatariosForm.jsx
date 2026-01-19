import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { toast } from "react-hot-toast";
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
  Button,
  Select,
  SelectItem
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
      telefono: initialData.telefono || '',
      // Map status fields (1/0, "Activo"/"Inactivo", true/false) to "1"/"0" string for Select
      estado_destinatario: (
        initialData.estado === 1 || initialData.estado === "1" ||
        initialData.estado_destinatario === 1 || initialData.estado_destinatario === "1" ||
        initialData.estado_proveedor === 1 || initialData.estado_proveedor === "1"
      ) ? "1" : "0"
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
      telefono: parsedInitialData.telefono || '',
      estado_destinatario: isEditMode ? parsedInitialData.estado_destinatario : "1"
    }
  });

  useEffect(() => {
    if (initialData) {
      const parsedData = parseInitialData();
      reset(parsedData);
      setDocumento(parsedData.documento || '');
      setIsDNI(parsedData.documento?.length === 8);
      setIsRUC(parsedData.documento?.length === 11);
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
        telefono,
        estado_destinatario
      } = data;

      const estado = Number(estado_destinatario);

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
            email,
            estado_destinatario: estado
          };
          result = await updateDestinatarioNatural(initialData.id, destinatarioData);
          if (result) {
            destinatarioResult = {
              ...initialData,
              ...destinatarioData,
              id: initialData.id,
              destinatario: `${nombre} ${apellidos}`,
              estado_destinatario: estado,
              estado
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
            email,
            estado_destinatario: estado
          };
          result = await updateDestinatarioJuridico(initialData.id, destinatarioData);
          if (result) {
            destinatarioResult = {
              ...initialData,
              ...destinatarioData,
              id: initialData.id,
              destinatario: razonsocial,
              estado_destinatario: estado,
              estado
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
            email,
            estado_destinatario: estado
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
              email,
              estado_destinatario: estado,
              estado
            };
          }
        } else if (documento.length === 11) {
          const destinatarioData = {
            ruc: documento,
            razon_social: razonsocial,
            ubicacion,
            direccion,
            telefono,
            email,
            estado_destinatario: estado
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
              email,
              estado_destinatario: estado,
              estado
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
      console.error(error);
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
      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        size="2xl"
        className="dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800"
        motionProps={{
          variants: {
            enter: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 0.95 }
          }
        }}
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-slate-800 dark:text-white border-b border-slate-100 dark:border-zinc-800 pb-3">
                {modalTitle}
              </ModalHeader>
              <ModalBody className="py-6 space-y-4">

                {/* Document + Status Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    name="documento"
                    control={control}
                    rules={{ required: "Documento requerido (8-11 dígitos)", minLength: 8, maxLength: 11 }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Documento"
                        variant="faded"
                        labelPlacement="outside"
                        placeholder="Ingrese documento"
                        value={documento}
                        onChange={handleDocumentoChange}
                        color={errors.documento ? "danger" : "default"}
                        errorMessage={errors.documento?.message}
                        isRequired
                      />
                    )}
                  />

                  <Controller
                    name="estado_destinatario"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Estado"
                        variant="faded"
                        labelPlacement="outside"
                        placeholder="Seleccione estado"
                        selectedKeys={field.value ? [field.value] : []}
                        classNames={{
                          trigger: "min-h-[40px]",
                        }}
                      >
                        <SelectItem key="1" textValue="Activo">Activo</SelectItem>
                        <SelectItem key="0" textValue="Inactivo">Inactivo</SelectItem>
                      </Select>
                    )}
                  />
                </div>

                {isDNI && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                      name="nombre"
                      control={control}
                      rules={{ required: isDNI ? "Nombre requerido" : false }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          label="Nombre"
                          variant="faded"
                          labelPlacement="outside"
                          placeholder="Ingrese nombres"
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
                          variant="faded"
                          labelPlacement="outside"
                          placeholder="Ingrese apellidos"
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
                        variant="faded"
                        labelPlacement="outside"
                        placeholder="Ingrese razón social"
                        color={errors.razonsocial ? "danger" : "default"}
                        errorMessage={errors.razonsocial?.message}
                        isRequired={isRUC}
                      />
                    )}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    name="telefono"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Teléfono"
                        variant="faded"
                        labelPlacement="outside"
                        placeholder="Ingrese teléfono"
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
                        variant="faded"
                        labelPlacement="outside"
                        placeholder="Ingrese ubicación"
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
                      variant="faded"
                      labelPlacement="outside"
                      placeholder="Ingrese dirección"
                      color={errors.direccion ? "danger" : "default"}
                      errorMessage={errors.direccion?.message}
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
                      variant="faded"
                      labelPlacement="outside"
                      placeholder="Ingrese email"
                      color={errors.email ? "danger" : "default"}
                      errorMessage={errors.email?.message}
                    />
                  )}
                />
              </ModalBody>
              <ModalFooter className="border-t border-slate-100 dark:border-zinc-800 mt-2">
                <Button
                  color="danger"
                  variant="light"
                  onPress={handleCloseModal}
                  className="font-medium"
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-blue-600 text-white font-bold shadow-blue-500/30"
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