import { useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem } from "@heroui/react";
import { useForm, Controller } from "react-hook-form";
import { addUnidad, updateUnidad } from "@/services/unidades.services";
import { toast } from "react-hot-toast";

const UnidadesForm = ({
    isVisible,
    onClose,
    modalTitle,
    initialData,
    onSuccess
}) => {
    const { control, handleSubmit, reset } = useForm({
        defaultValues: {
            codigo_sunat: '',
            descripcion: '',
            estado: '1'
        }
    });

    useEffect(() => {
        if (initialData) {
            reset({
                ...initialData,
                estado: String(initialData.estado)
            });
        }
    }, [initialData, reset]);

    const onSubmit = async (data) => {
        try {
            const payload = {
                ...data,
                estado: parseInt(data.estado)
            };

            if (initialData) {
                await updateUnidad(initialData.id_unidad, payload);
                toast.success("Unidad actualizada");
            } else {
                await addUnidad(payload);
                toast.success("Unidad creada");
            }
            onSuccess();
        } catch (error) {
            toast.error("Error al guardar la unidad");
        }
    };

    return (
        <Modal isOpen={isVisible} onClose={onClose}>
            <ModalContent>
                <ModalHeader>{modalTitle}</ModalHeader>
                <ModalBody>
                    <form id="unidades-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Controller
                            name="codigo_sunat"
                            control={control}
                            rules={{ required: "Requerido" }}
                            render={({ field }) => (
                                <Input {...field} label="Código SUNAT" placeholder="Ej: NIU, KGM, MTR" variant="bordered" />
                            )}
                        />
                        <Controller
                            name="descripcion"
                            control={control}
                            rules={{ required: "Requerido" }}
                            render={({ field }) => (
                                <Input {...field} label="Descripción" placeholder="Ej: Unidades, Kilogramos" variant="bordered" />
                            )}
                        />
                        <Controller
                            name="estado"
                            control={control}
                            render={({ field }) => (
                                <Select {...field} label="Estado" selectedKeys={[field.value]}>
                                    <SelectItem key="1" value="1">Activo</SelectItem>
                                    <SelectItem key="0" value="0">Inactivo</SelectItem>
                                </Select>
                            )}
                        />
                    </form>
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>Cancelar</Button>
                    <Button color="primary" type="submit" form="unidades-form">Guardar</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default UnidadesForm;
