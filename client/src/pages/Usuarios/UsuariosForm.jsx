import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { Toaster, toast } from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { addUsuario, updateUsuario, getUsuarios } from '@/services/usuario.services';
import { getRoles } from '@/services/rol.services';
import {
  Input,
  Button,
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

const UsuariosForm = ({ modalTitle, onClose, initialData }) => {
    const [roles, setRoles] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [isOpen, setIsOpen] = useState(true);

    const { control, handleSubmit, formState: { errors }, reset } = useForm({
        defaultValues: initialData?.data || {
            id_rol: '',
            usua: '',
            contra: '',
            estado_usuario: '',
        }
    });

    useEffect(() => {
        getRols();
        fetchUsuarios();
    }, []);

    useEffect(() => {
        if (initialData && roles.length > 0) {
            reset(initialData.data);
        }
    }, [initialData, roles, reset]);

    const getRols = async () => {
        const data = await getRoles();
        // Excluir el rol "administrador"
        const filteredRoles = data.filter((rol) => rol.nom_rol.toLowerCase() !== "administrador");
        setRoles(filteredRoles);
    };

    const fetchUsuarios = async () => {
        const data = await getUsuarios();
        setUsuarios(data);
    };

    const onSubmit = async (data) => {
        try {
            const { id_rol, usua, contra, estado_usuario } = data;

            // Obtener el usuario con el rol "administrador"
            const adminUser = usuarios.find((usuario) => usuario.nom_rol.toLowerCase() === "administrador");

            if (!adminUser) {
                toast.error("No se encontró un usuario con el rol de administrador.");
                return;
            }

            const newUser = {
                id_rol: parseInt(id_rol),
                usua,
                contra,
                estado_usuario: parseInt(estado_usuario),
                id_empresa: adminUser.id_empresa, // Asignar el id_empresa del administrador
            };

            let result;
            if (initialData) {
                result = await updateUsuario(initialData?.id_usuario, newUser);
            } else {
                result = await addUsuario(newUser);
            }

            if (result) {
                toast.success(initialData ? "Usuario actualizado correctamente" : "Usuario creado correctamente");
                handleCloseModal();
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } catch (error) {
            toast.error("Error al realizar la gestión del usuario");
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
                                            name="id_rol"
                                            control={control}
                                            rules={{ required: "El rol es requerido" }}
                                            render={({ field }) => (
                                                <Select
                                                    {...field}
                                                    label="Rol"
                                                    variant="bordered"
                                                    placeholder="Seleccione un rol"
                                                    selectedKeys={field.value ? [field.value.toString()] : []}
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                    isRequired
                                                    color={errors.id_rol ? "danger" : "default"}
                                                    errorMessage={errors.id_rol?.message}
                                                >
                                                    {roles.map((rol) => (
                                                        <SelectItem key={rol.id_rol.toString()} value={rol.id_rol.toString()}>
                                                            {rol.nom_rol}
                                                        </SelectItem>
                                                    ))}
                                                </Select>
                                            )}
                                        />
                                    </div>

                                    <div className="col-span-1">
                                        <Controller
                                            name="usua"
                                            control={control}
                                            rules={{ required: "El usuario es requerido" }}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    label="Usuario"
                                                    variant="bordered"
                                                    color={errors.usua ? "danger" : "default"}
                                                    errorMessage={errors.usua?.message}
                                                    isRequired
                                                />
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="col-span-1">
                                        <Controller
                                            name="contra"
                                            control={control}
                                            rules={{ required: "La contraseña es requerida" }}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    type={showPassword ? "text" : "password"}
                                                    label="Contraseña"
                                                    variant="bordered"
                                                    color={errors.contra ? "danger" : "default"}
                                                    errorMessage={errors.contra?.message}
                                                    isRequired
                                                    endContent={
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="focus:outline-none"
                                                        >
                                                            {showPassword ? (
                                                                <IoMdEyeOff className="text-xl text-gray-400" />
                                                            ) : (
                                                                <IoMdEye className="text-xl text-gray-400" />
                                                            )}
                                                        </button>
                                                    }
                                                />
                                            )}
                                        />
                                    </div>

                                    <div className="col-span-1">
                                        <Controller
                                            name="estado_usuario"
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
                                                    color={errors.estado_usuario ? "danger" : "default"}
                                                    errorMessage={errors.estado_usuario?.message}
                                                >
                                                    <SelectItem key="1" value="1">Activo</SelectItem>
                                                    <SelectItem key="0" value="0">Inactivo</SelectItem>
                                                </Select>
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

UsuariosForm.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    initialData: PropTypes.object
};

export default UsuariosForm;