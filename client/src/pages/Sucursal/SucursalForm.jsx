import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Toaster, toast } from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { useVendedoresData } from '@/services/sucursal.services';
import GooglePlacesAutocomplete from '@/components/GooglePlacesAutocomplete/GooglePlacesAutocomplete';
import {
  Input,
  Button
} from "@heroui/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Autocomplete,
  AutocompleteItem,
  Select,
  SelectItem
} from '@heroui/react';

const SucursalForm = ({ modalTitle, onClose, initialData, onSuccess }) => {
  const { vendedores } = useVendedoresData();
  const [isOpen, setIsOpen] = useState(true);
  const [filtroVendedor, setFiltroVendedor] = useState('');

  const { control, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm({
    defaultValues: initialData || {
      nombre_vendedor: '',
      dni_vendedor: '',
      nombre_sucursal: '',
      ubicacion: '',
      estado_sucursal: '1',
    }
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
      const vendedor = vendedores.find(v => v.dni === initialData.dni_vendedor);
      setFiltroVendedor(
        vendedor ? `${vendedor.nombre} (${vendedor.dni})` : ''
      );
    } else {
      reset({
        nombre_vendedor: '',
        dni_vendedor: '',
        nombre_sucursal: '',
        ubicacion: '',
        estado_sucursal: '1',
      });
      setFiltroVendedor('');
    }
  }, [initialData, reset, vendedores]);

  // Para mostrar el nombre del vendedor seleccionado en el input
  const dni_vendedor = watch('dni_vendedor');
  const vendedorSeleccionado = vendedores.find(v => v.dni === dni_vendedor);

const onSubmit = (data) => {
  if (!data.dni_vendedor) {
    toast.error("Debe seleccionar un vendedor");
    return;
  }
  if (!data.nombre_sucursal.trim() || !data.ubicacion.trim()) {
    toast.error("Por favor, complete los campos obligatorios.");
    return;
  }
  onSuccess({
    ...data,
    dni: data.dni_vendedor,
    estado_sucursal: Number(data.estado_sucursal),
  });
  handleCloseModal();
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
      <Modal isOpen={isOpen} onClose={handleCloseModal} size="md">
        <ModalContent>
          <>
            <ModalHeader className="flex flex-col gap-1">
              {modalTitle}
            </ModalHeader>
            <ModalBody>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Controller
                  name="dni_vendedor"
                  control={control}
                  rules={{ required: "Debe seleccionar un vendedor" }}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      className="mb-4"
                      label="Vendedor"
                      placeholder="Buscar vendedor por nombre o DNI..."
                      selectedKey={field.value}
                      inputValue={
                        filtroVendedor ||
                        (vendedorSeleccionado
                          ? `${vendedorSeleccionado.nombre} (${vendedorSeleccionado.dni})`
                          : '')
                      }
                      onInputChange={setFiltroVendedor}
                      onSelectionChange={key => {
                        const vendedor = vendedores.find(v => v.dni === key);
                        if (vendedor) {
                          field.onChange(vendedor.dni); // Actualiza dni_vendedor en el form
                          setValue('nombre_vendedor', vendedor.nombre); // Actualiza nombre_vendedor en el form
                          setFiltroVendedor(`${vendedor.nombre} (${vendedor.dni})`);
                        }
                      }}
                      isInvalid={!!errors.dni_vendedor}
                      errorMessage={errors.dni_vendedor?.message}
                    >
                      {vendedores.map((v) => (
                        <AutocompleteItem 
                          key={v.dni}
                          textValue={`${v.nombre} (${v.dni})`}
                        >
                          {v.nombre} ({v.dni})
                        </AutocompleteItem>
                      ))}
                    </Autocomplete>
                  )}
                />
                <Controller
                  name="nombre_sucursal"
                  control={control}
                  rules={{ required: "El nombre de la sucursal es requerido" }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Nombre de la Sucursal"
                      placeholder="Ej: Sucursal Principal"
                      isInvalid={!!errors.nombre_sucursal}
                      errorMessage={errors.nombre_sucursal?.message}
                      isRequired
                      variant="bordered"
                      className="mb-4"
                    />
                  )}
                />
                <Controller
                  name="ubicacion"
                  control={control}
                  rules={{ required: "La ubicación es requerida" }}
                  render={({ field }) => (
                    <GooglePlacesAutocomplete
                      {...field}
                      isInvalid={!!errors.ubicacion}
                      errorMessage={errors.ubicacion?.message}
                      isRequired
                      variant="bordered"
                      className="mb-4"
                    />
                  )}
                />
                <Controller
                  name="estado_sucursal"
                  control={control}
                  rules={{ required: "El estado es requerido" }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      label="Estado"
                      selectedKeys={field.value ? [field.value.toString()] : []}
                      onChange={e => field.onChange(e.target.value)}
                      className="mb-2"
                      variant="bordered"
                      isRequired
                      color={errors.estado_sucursal ? "danger" : "default"}
                      errorMessage={errors.estado_sucursal?.message}
                    >
                      <SelectItem key="1" value="1">Activo</SelectItem>
                      <SelectItem key="0" value="0">Inactivo</SelectItem>
                    </Select>
                  )}
                />
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={handleCloseModal}>
                    Cancelar
                  </Button>
                  <Button color="primary" type="submit">
                    Guardar
                  </Button>
                </ModalFooter>
              </form>
            </ModalBody>
          </>
        </ModalContent>
      </Modal>
    </>
  );
};

SucursalForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  initialData: PropTypes.object,
};

export default SucursalForm;