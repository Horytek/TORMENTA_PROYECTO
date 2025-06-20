import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { Toaster, toast } from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { addVendedor, updateVendedor } from '@/services/vendedor.services';
import { getUsuarios } from '@/services/usuario.services';
import { getVendedores } from '@/services/vendedor.services';
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
    Select,
    SelectItem
  } from "@nextui-org/react";

const VendedoresForm = ({ modalTitle, onClose, initialData, onSuccess }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [isOpen, setIsOpen] = useState(true);

  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      dni: '',
      id_usuario: '',
      nombres: '',
      apellidos: '',
      telefono: '',
      estado_vendedor: ''
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usuariosData = await getUsuarios();
        setUsuarios(usuariosData);

        const vendedoresData = await getVendedores();
        setVendedores(vendedoresData);
      } catch (error) {
        toast.error("Error al cargar los datos");
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (initialData) {
      reset({
        dni: initialData.dni || '',
        id_usuario: initialData.id_usuario || '',
        nombres: initialData.nombres || '',
        apellidos: initialData.apellidos || '',
        telefono: initialData.telefono || '',
        estado_vendedor: initialData.estado_vendedor?.toString() || ''
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data) => {
    const { dni, id_usuario, nombres, apellidos, telefono, estado_vendedor } = data;

    const newVendedor = {
      dni,
      nuevo_dni: initialData?.dni && initialData.dni !== dni ? dni : undefined,
      id_usuario,
      nombres,
      apellidos,
      telefono,
      estado_vendedor
    };

    let result;
    if (initialData) {
      result = await updateVendedor(initialData.dni, newVendedor);
    } else {
      result = await addVendedor(newVendedor);
    }

    const [success, errorMessage] = result;

    if (success) {
      toast.success(initialData ? "Vendedor actualizado correctamente" : "Vendedor creado correctamente");
      handleCloseModal();
      if (initialData) {
        onSuccess(initialData.dni, { ...newVendedor, usua: usuarios.find(u => u.id_usuario === parseInt(id_usuario))?.usua });
      } else {
        onSuccess({ ...newVendedor, usua: usuarios.find(u => u.id_usuario === parseInt(id_usuario))?.usua });
      }
    } else {
      toast.error(errorMessage || "Error inesperado al gestionar el vendedor");
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <Controller
                      name="dni"
                      control={control}
                      rules={{ required: "El DNI es requerido" }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          label="DNI"
                          variant="bordered"
                          color={errors.dni ? "danger" : "default"}
                          errorMessage={errors.dni?.message}
                          isRequired
                        />
                      )}
                    />
                  </div>

                  <div className="col-span-1">
                    <Controller
                      name="id_usuario"
                      control={control}
                      rules={{ required: "El usuario es requerido" }}
                      render={({ field }) => (
                        <Select
                          {...field}
                          label="Usuario"
                          variant="bordered"
                          placeholder="Seleccione un usuario"
                          selectedKeys={field.value ? [field.value.toString()] : []}
                          onChange={(e) => field.onChange(e.target.value)}
                          isRequired
                          color={errors.id_usuario ? "danger" : "default"}
                          errorMessage={errors.id_usuario?.message}
                        >
                          {usuarios.map((usuario) => (
                            <SelectItem
                              key={usuario.id_usuario.toString()}
                              value={usuario.id_usuario.toString()}
                              isDisabled={vendedores.some((vendedor) => 
                                vendedor.id_usuario === usuario.id_usuario) && 
                                initialData?.id_usuario !== usuario.id_usuario}
                            >
                              {usuario.usua}
                            </SelectItem>
                          ))}
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="col-span-1">
                    <Controller
                      name="nombres"
                      control={control}
                      rules={{ required: "El nombre es requerido" }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          label="Nombre"
                          variant="bordered"
                          color={errors.nombres ? "danger" : "default"}
                          errorMessage={errors.nombres?.message}
                          isRequired
                        />
                      )}
                    />
                  </div>

                  <div className="col-span-1">
                    <Controller
                      name="apellidos"
                      control={control}
                      rules={{ required: "Los apellidos son requeridos" }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          label="Apellidos"
                          variant="bordered"
                          color={errors.apellidos ? "danger" : "default"}
                          errorMessage={errors.apellidos?.message}
                          isRequired
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="col-span-1">
                    <Controller
                      name="estado_vendedor"
                      control={control}
                      rules={{ required: "El estado es requerido" }}
                      render={({ field }) => (
                        <Select
                          {...field}
                          label="Estado"
                          variant="faded"
                          placeholder="Seleccione un estado"
                          selectedKeys={field.value ? [field.value.toString()] : []}
                          onChange={(e) => field.onChange(e.target.value)}
                          isRequired
                          color={errors.estado_vendedor ? "danger" : "default"}
                          errorMessage={errors.estado_vendedor?.message}
                        >
                          <SelectItem key="1" value="1">Activo</SelectItem>
                          <SelectItem key="0" value="0">Inactivo</SelectItem>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="col-span-1">
                    <Controller
                      name="telefono"
                      control={control}
                      rules={{ required: "El teléfono es requerido" }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          label="Teléfono"
                          variant="bordered"
                          color={errors.telefono ? "danger" : "default"}
                          errorMessage={errors.telefono?.message}
                          isRequired
                        />
                      )}
                    />
                  </div>
                </div>
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

VendedoresForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  initialData: PropTypes.object
};

export default VendedoresForm;