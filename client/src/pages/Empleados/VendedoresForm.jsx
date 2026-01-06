import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaPlus } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { addVendedor, updateVendedor } from '@/services/vendedor.services';
import { getUsuarios, addUsuario, getUsuario_1 } from '@/services/usuario.services';
import { getVendedores } from '@/services/vendedor.services';
import { getRoles } from '@/services/rol.services';
import { getEmpresas } from '@/services/empresa.services';
import { useUserStore } from '@/store/useStore';
import {
  Input,
  Button,
  Tooltip,
  Divider
} from "@heroui/react";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem
} from '@heroui/react';

const VendedoresForm = ({ modalTitle, onClose, initialData, onSuccess }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [_roles, setRoles] = useState([]);
  const [_empresas, setEmpresas] = useState([]);
  const [currentUserEmpresa, setCurrentUserEmpresa] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [showMiniModal, setShowMiniModal] = useState(false);
  const { usuario } = useUserStore();

  // Estados para el mini modal de usuario
  const [newUserData, setNewUserData] = useState({
    usua: '',
    contra: '', // Cambiado de 'clave' a 'contra' para coincidir con el backend
    estado_usuario: '1',
    id_rol: '', // Sin valor por defecto, usuario debe seleccionar
    id_empresa: '' // Se asignará dinámicamente
  });

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

        const rolesData = await getRoles();
        setRoles(rolesData);

        // Obtener empresas disponibles
        const empresasData = await getEmpresas();
        setEmpresas(empresasData || []);

        // Obtener la empresa del usuario actual
        let userEmpresaId = null;
        if (usuario) {
          try {
            const currentUserData = await getUsuario_1(usuario);
            if (currentUserData && currentUserData.length > 0) {
              userEmpresaId = currentUserData[0].id_empresa;
              setCurrentUserEmpresa(userEmpresaId);
            }
          } catch (error) {
            console.error('Error getting current user empresa:', error);
          }
        }

        // Si no se pudo obtener la empresa del usuario, usar la primera empresa disponible
        if (!userEmpresaId && empresasData && empresasData.length > 0) {
          userEmpresaId = empresasData[0].id_empresa;
          setCurrentUserEmpresa(userEmpresaId);
        }

        // Buscar automáticamente el rol de "Empleados"
        const empleadoRole = rolesData.find(rol =>
          rol.nom_rol.toLowerCase().includes('empleado') ||
          rol.nom_rol.toLowerCase().includes('vendedor')
        );

        // Actualizar newUserData con la empresa válida y el rol detectado
        setNewUserData(prev => ({
          ...prev,
          id_rol: empleadoRole ? empleadoRole.id_rol.toString() : '',
          id_empresa: userEmpresaId ? userEmpresaId.toString() : ''
        }));
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error("Error al cargar los datos");
      }
    };
    fetchData();
  }, [usuario]);

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

  const handleCreateUser = async () => {
    try {
      console.log('Datos a enviar:', newUserData);
      const success = await addUsuario(newUserData);

      if (success) {
        toast.success("Usuario creado correctamente");
        setShowMiniModal(false);
        // Resetear formulario manteniendo empresa y rol detectados automáticamente
        setNewUserData(prev => ({
          usua: '',
          contra: '',
          estado_usuario: '1',
          id_rol: prev.id_rol, // Mantener el rol detectado
          id_empresa: prev.id_empresa // Mantener la empresa detectada
        }));

        // Recargar usuarios
        const usuariosData = await getUsuarios();
        setUsuarios(usuariosData);
      } else {
        toast.error("Error al crear usuario");
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error("Error inesperado al crear usuario");
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        size="2xl"
      >
        <ModalContent>
          {(_onClose) => (
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
                    <div className="flex gap-2">
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
                            className="flex-1"
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
                      <Tooltip content="Crear nuevo usuario" color="primary">
                        <Button
                          isIconOnly
                          color="secondary"
                          variant="flat"
                          onPress={() => setShowMiniModal(true)}
                          className="mt-1 h-[46px]"
                        >
                          <FaPlus />
                        </Button>
                      </Tooltip>
                    </div>
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

      {/* Mini Modal para crear usuario */}
      <Modal
        isOpen={showMiniModal}
        onClose={() => setShowMiniModal(false)}
        size="md"
      >
        <ModalContent>
          {(_onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Nuevo usuario
                <Divider />

              </ModalHeader>
              <ModalBody>
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold">Rol asignado:</span> Empleados
                  </div>


                  <Input
                    label="Usuario"
                    variant="bordered"
                    value={newUserData.usua}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, usua: e.target.value }))}
                    isRequired
                  />
                  <Input
                    label="Contraseña"
                    type="password"
                    variant="bordered"
                    value={newUserData.contra}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, contra: e.target.value }))}
                    isRequired
                  />

                  <Select
                    label="Estado"
                    variant="bordered"
                    selectedKeys={[newUserData.estado_usuario]}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, estado_usuario: e.target.value }))}
                  >
                    <SelectItem key="1" value="1">Activo</SelectItem>
                    <SelectItem key="0" value="0">Inactivo</SelectItem>
                  </Select>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={() => {
                    setShowMiniModal(false);
                    // Resetear formulario manteniendo empresa y rol detectados automáticamente
                    setNewUserData(prev => ({
                      usua: '',
                      contra: '',
                      estado_usuario: '1',
                      id_rol: prev.id_rol, // Mantener el rol detectado
                      id_empresa: prev.id_empresa // Mantener la empresa detectada
                    }));
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={handleCreateUser}
                  isDisabled={!newUserData.usua || !newUserData.contra || !newUserData.id_empresa}
                >
                  Crear usuario
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