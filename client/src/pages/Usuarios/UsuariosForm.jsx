import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { toast } from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { addUsuario, updateUsuario } from '@/services/usuario.services';
import { getRoles } from '@/services/rol.services';
import {
    Input,
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Select,
    SelectItem
} from "@heroui/react";

const UsuariosForm = ({ modalTitle, onClose, initialData, onSuccess, usuarios }) => {
    const [roles, setRoles] = useState([]);
    const [isOpen, setIsOpen] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    const { control, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            id_rol: "",
            usua: "",
            contra: "",
            estado_usuario: "1"
        }
    });

    useEffect(() => {
        getRols();
        if (initialData) {
            reset({
                id_rol: initialData.data.id_rol.toString(),
                usua: initialData.data.usua,
                contra: "", // Always start with empty password for security
                estado_usuario: initialData.data.estado_usuario.toString()
            });
        }
    }, [initialData, reset]);

    const getRols = async () => {
        try {
            const data = await getRoles();
            if (Array.isArray(data)) {
                // Excluir el rol "administrador" para que no se pueda crear otro admin fácilmente si no se desea
                // O permitirlo si es la intención. Mantengo la lógica original de filtrar.
                const filteredRoles = data.filter((rol) => rol.nom_rol.toLowerCase() !== "administrador");
                setRoles(filteredRoles);
            }
        } catch (error) {
            console.error("Error fetching roles:", error);
            toast.error("Error al cargar roles");
        }
    };

    const onSubmit = async (data) => {
        try {
            const { id_rol, usua, contra, estado_usuario } = data;

            // Obtener el usuario con el rol "administrador" del prop usuarios para heredar id_empresa
            // Esto asume que siempre hay un admin en la lista 'usuarios' pasada como prop
            const adminUser = usuarios.find((usuario) => usuario.nom_rol && usuario.nom_rol.toLowerCase() === "administrador");

            // Fallback si no se encuentra admin (aunque debería existir)
            const idEmpresa = adminUser ? adminUser.id_empresa : 1;

            const newUser = {
                id_rol: parseInt(id_rol),
                usua,
                estado_usuario: parseInt(estado_usuario),
                id_empresa: idEmpresa,
            };

            // Only include password if it was typed/changed
            if (contra) {
                newUser.contra = contra;
            }

            let result;
            if (initialData) {
                // Si estamos editando, no enviamos la contraseña si no se cambió (o manejamos la lógica en backend)
                // En este caso, el backend ya maneja si la contraseña es diferente para hashearla
                result = await updateUsuario(initialData.id_usuario, newUser);
                if (result) {
                    toast.success("Usuario actualizado correctamente");
                    onSuccess(initialData.id_usuario, newUser);
                }
            } else {
                result = await addUsuario(newUser);
                if (result) {
                    toast.success("Usuario creado correctamente");
                    // onSuccess espera el nuevo usuario con su ID
                    // Si addUsuario devuelve true, no tenemos el ID. 
                    // Necesitamos que addUsuario devuelva el objeto o ID.
                    // Asumimos que addUsuario devuelve true/false por ahora y recargamos.
                    onSuccess(newUser);
                }
            }
            handleCloseModal();
        } catch (error) {
            console.error(error);
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
            <Modal
                isOpen={isOpen}
                onClose={handleCloseModal}
                size="2xl"
                backdrop="blur"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 text-blue-900 dark:text-blue-100">
                                {modalTitle}
                            </ModalHeader>
                            <ModalBody>
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="col-span-1">
                                            <Controller
                                                name="id_rol"
                                                control={control}
                                                rules={{ required: "El rol es requerido" }}
                                                render={({ field }) => (
                                                    <Select
                                                        {...field}
                                                        label="Rol"
                                                        variant="faded"
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
                                                        variant="faded"
                                                        color={errors.usua ? "danger" : "default"}
                                                        errorMessage={errors.usua?.message}
                                                        isRequired
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="col-span-1">
                                            <Controller
                                                name="contra"
                                                control={control}
                                                rules={{ required: !initialData && "La contraseña es requerida" }}
                                                render={({ field }) => (
                                                    <Input
                                                        {...field}
                                                        type={showPassword ? "text" : "password"}
                                                        label="Contraseña"
                                                        placeholder={initialData ? "Dejar en blanco para mantener la actual" : "Ingrese su contraseña"}
                                                        variant="faded"
                                                        color={errors.contra ? "danger" : "default"}
                                                        errorMessage={errors.contra?.message}
                                                        isRequired={!initialData}
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
                                </form>
                            </ModalBody>
                            <ModalFooter>
                                <ButtonClose onPress={handleCloseModal} />
                                <ButtonSave onPress={handleSubmit(onSubmit)} />
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
    onSuccess: PropTypes.func.isRequired,
    initialData: PropTypes.object,
    usuarios: PropTypes.array.isRequired,
};

export default UsuariosForm;