import { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from "react-hook-form";
import PropTypes from 'prop-types';
import { toast } from "react-hot-toast";
import {
    Modal, ModalContent, ModalHeader, ModalBody,
    ModalFooter, Input, Select, SelectItem
} from '@heroui/react';
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";

const UsuariosForm = ({ modalTitle, onClose, initialData, onSuccess }) => {
    const { control, handleSubmit, formState: { errors }, reset, watch } = useForm({
        defaultValues: initialData?.data
            ? {
                nom_rol: initialData.data.nom_rol || '',
                estado_rol: (initialData.data.estado_rol !== undefined && initialData.data.estado_rol !== null)
                    ? String(initialData.data.estado_rol)
                    : '1'
            }
            : { nom_rol: '', estado_rol: '1' }
    });

    const [isSaveDisabled, setIsSaveDisabled] = useState(false);
    const toastShownRef = useRef(false);

    useEffect(() => {
        if (initialData) {
            reset(initialData.data);
        }
    }, [initialData, reset]);

    // Utilidad para normalizar texto (eliminar acentos, espacios extra, etc.)
    const normalize = (text) =>
        text
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // elimina acentos
            .replace(/\s+/g, " ") // reemplaza múltiples espacios por uno
            .trim()
            .toLowerCase();

    const forbiddenPatterns = [
        /admin\b/i,
        /\badministrador\b/i,
        /\badministration\b/i,
        /admin.*?/i,
        /.*?admin/i
    ];

    const watchNomRol = watch('nom_rol', '');

    useEffect(() => {
        const normalized = normalize(watchNomRol);
        const isForbidden = forbiddenPatterns.some((regex) => regex.test(normalized));

        if (isForbidden) {
            setIsSaveDisabled(true);
            if (!toastShownRef.current) {
                toast.error("El nombre del rol no puede contener palabras como 'administrador', 'admin', etc.");
                toastShownRef.current = true;
            }
        } else {
            setIsSaveDisabled(false);
            toastShownRef.current = false;
        }
    }, [watchNomRol]);

    const onSubmit = handleSubmit(async (data) => {
        try {
            const nom_rol = data.nom_rol?.trim();
            const estadoNum = parseInt(data.estado_rol, 10);
            const newUser = {
                nom_rol,
                estado_rol: Number.isNaN(estadoNum) ? 1 : estadoNum
            };
            if (initialData && initialData.id_rol) {
                await onSuccess(initialData.id_rol, newUser);
            } else {
                await onSuccess(newUser);
            }
            onClose();
        } catch {
            toast.error("Error al realizar la gestión del rol");
        }
    });

    return (
        <div>
            <Modal isOpen={true} onClose={onClose} backdrop="blur">
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1 text-slate-900 dark:text-slate-100">
                        {modalTitle}
                    </ModalHeader>
                    {/* Move form outside body/footer separation or wrap body? ModalBody handles scroll. */}
                    {/* Standard structure: ModalBody contains form fields. Footer contains buttons triggering submit. */}
                    <ModalBody>
                        <form id="roles-form" onSubmit={onSubmit} className="space-y-4">
                            <div>
                                <Controller
                                    name="nom_rol"
                                    control={control}
                                    rules={{ required: "Campo obligatorio" }}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            label="Nombre del Rol"
                                            placeholder="Ingrese el nombre del rol"
                                            variant="bordered"
                                            color={errors.nom_rol ? "danger" : "default"}
                                            errorMessage={errors.nom_rol?.message}
                                            isRequired
                                        />
                                    )}
                                />
                            </div>

                            <div>
                                <Controller
                                    name="estado_rol"
                                    control={control}
                                    rules={{ required: "Campo obligatorio" }}
                                    render={({ field }) => (
                                        <Select
                                            label="Estado"
                                            variant="bordered"
                                            selectedKeys={new Set([String(field.value)])}
                                            onSelectionChange={(keys) => {
                                                const val = Array.from(keys)[0];
                                                field.onChange(val);
                                            }}
                                            color={errors.estado_rol ? "danger" : "default"}
                                            errorMessage={errors.estado_rol?.message}
                                            isRequired
                                        >
                                            <SelectItem key="1" value="1">Activo</SelectItem>
                                            <SelectItem key="0" value="0">Inactivo</SelectItem>
                                        </Select>
                                    )}
                                />
                            </div>
                        </form>
                    </ModalBody>

                    <ModalFooter>
                        <ButtonClose onPress={onClose} />
                        <ButtonSave onPress={onSubmit} isDisabled={isSaveDisabled} />
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
};

UsuariosForm.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    initialData: PropTypes.object
};

export default UsuariosForm;
