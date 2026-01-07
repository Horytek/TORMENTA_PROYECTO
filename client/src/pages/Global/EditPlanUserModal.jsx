import React, { useEffect } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Select,
    SelectItem,
    Autocomplete,
    AutocompleteItem,
} from "@heroui/react";
import { useForm, Controller } from "react-hook-form";
import { updateUsuarioPlan } from "@/services/usuario.services";
import { toast } from "react-hot-toast";

const EditPlanUserModal = ({ isOpen, onClose, user, companies, onSuccess }) => {
    const { control, handleSubmit, reset } = useForm({
        defaultValues: {
            id_empresa: "",
            plan_pago: "",
            estado_usuario: "",
            fecha_pago: ""
        }
    });

    useEffect(() => {
        if (user) {
            reset({
                id_empresa: user.id_empresa?.toString() || "",
                plan_pago: user.plan_pago || "basic",
                estado_usuario: user.estado_usuario_1?.toString() || "0",
                fecha_pago: user.fecha_pago ? new Date(user.fecha_pago).toISOString().split("T")[0] : "",
            });
        }
    }, [user, reset]);

    const onSubmit = async (data) => {
        try {
            const planMapping = {
                "enterprise": 1,
                "pro": 2,
                "basic": 3
            };
            // If the plan value in data is not one of the keys, unmap it (fallback)
            // Check if data.plan_pago is strictly the string key or might be the id already if not changed? 
            // In previous code: user.plan_pago was "enterprise" etc.
            // The service expects 1, 2, 3.

            const planId = planMapping[data.plan_pago] || 3;

            await updateUsuarioPlan(user.id_usuario, {
                id_empresa: data.id_empresa,
                plan_pago: planId,
                estado_usuario: data.estado_usuario,
                fecha_pago: data.fecha_pago || null,
            });

            toast.success("Usuario actualizado correctamente");
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar usuario");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">Editar Usuario: {user?.usua}</ModalHeader>
                        <ModalBody>
                            <form id="edit-user-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Empresa</label>
                                    <Controller
                                        name="id_empresa"
                                        control={control}
                                        render={({ field }) => (
                                            <Autocomplete
                                                defaultItems={companies}
                                                placeholder="Seleccionar empresa"
                                                selectedKey={field.value}
                                                onSelectionChange={field.onChange}
                                                variant="bordered"
                                            >
                                                {(item) => <AutocompleteItem key={item.id_empresa}>{item.razonSocial}</AutocompleteItem>}
                                            </Autocomplete>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Plan</label>
                                        <Controller
                                            name="plan_pago"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    selectedKeys={[field.value]}
                                                    onChange={field.onChange}
                                                    placeholder="Seleccionar plan"
                                                    variant="bordered"
                                                >
                                                    <SelectItem key="basic">Plan Básico</SelectItem>
                                                    <SelectItem key="pro">Plan Pro</SelectItem>
                                                    <SelectItem key="enterprise">Plan Enterprise</SelectItem>
                                                </Select>
                                            )}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                                        <Controller
                                            name="estado_usuario"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    selectedKeys={[field.value]}
                                                    onChange={field.onChange}
                                                    placeholder="Seleccionar estado"
                                                    variant="bordered"
                                                >
                                                    <SelectItem key="1">Activo</SelectItem>
                                                    <SelectItem key="0">Inactivo</SelectItem>
                                                </Select>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Pago</label>
                                    <Controller
                                        name="fecha_pago"
                                        control={control}
                                        render={({ field }) => (
                                            <Input
                                                type="date"
                                                variant="bordered"
                                                {...field}
                                            />
                                        )}
                                    />
                                </div>

                            </form>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>
                                Cancelar
                            </Button>
                            <Button color="primary" type="submit" form="edit-user-form">
                                Guardar Cambios
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default EditPlanUserModal;
