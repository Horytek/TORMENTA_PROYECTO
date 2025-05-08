import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { Toaster, toast } from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { addVendedor, updateVendedor } from '@/services/vendedor.services';
import { getUsuarios } from '@/services/usuario.services';
import { getVendedores } from '@/services/vendedor.services';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Input,
  Button
} from "@heroui/react";

import {
  Select,
  SelectItem
} from "@nextui-org/react";

const VendedoresForm = ({ modalTitle, onClose, initialData }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [isOpen, setIsOpen] = useState(true);
  
  localStorage.setItem("dni_r", initialData?.dni || '');

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      dni: initialData?.dni || '',
      id_usuario: initialData?.id_usuario || '',
      nombres: initialData?.nombres || '',
      apellidos: initialData?.apellidos || '',
      telefono: initialData?.telefono || '',
      estado_vendedor: initialData?.estado_vendedor?.toString() || ''
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

  const onSubmit = async (data) => {
    try {
      const { dni, id_usuario, nombres, apellidos, telefono, estado_vendedor } = data;
      const dni_ver = localStorage.getItem("dni_r");
  
      const newVendedor = {
        dni: dni_ver || dni,
        nuevo_dni: dni_ver !== dni ? dni : undefined,
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
  
      if (result) {
        toast.success(initialData ? "Vendedor actualizado correctamente" : "Vendedor creado correctamente");
        handleCloseModal();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
  
    } catch (error) {
      toast.error("Error al realizar la gestión del vendedor");
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
  initialData: PropTypes.object
};

export default VendedoresForm;
