import { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from "react-hook-form";
import PropTypes from 'prop-types';
import { IoMdClose } from "react-icons/io";
import { Toaster, toast } from "react-hot-toast";
import { addRol, updateRol } from '@/services/rol.services';
import { Modal, ModalContent, ModalHeader, ModalBody,
ModalFooter, Button, Input, Select, SelectItem } from '@heroui/react';

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
            <Toaster />
            <Modal isOpen={true} onClose={onClose}>
                <ModalContent>
                    <ModalHeader>
                        <h3 className="font-bold text-black">
                            {modalTitle}
                        </h3>
                  
                    </ModalHeader>
                    <form onSubmit={onSubmit}>
                        <ModalBody>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700">Rol:</label>
                                    <Controller
                                      name="nom_rol"
                                      control={control}
                                      rules={{ required: "Campo obligatorio" }}
                                      render={({ field }) => (
                                        <Input
                                          {...field}
                                          aria-label="Rol"
                                          placeholder="Ingrese el nombre del rol"
                                          className={`w-full ${errors.nom_rol ? 'border-red-600' : 'border-gray-300'} rounded-lg p-2`}
                                        />
                                      )}
                                    />
                                    {errors.nom_rol && <p className="text-xs text-red-600">{errors.nom_rol.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700">Estado:</label>
                                    <Controller
                                      name="estado_rol"
                                      control={control}
                                      rules={{ required: "Campo obligatorio" }}
                                      render={({ field }) => (
                                        <Select
                                          aria-label="Estado"
                                          selectedKeys={new Set([String(field.value)])}
                                          onSelectionChange={(keys) => {
                                            const val = Array.from(keys)[0];
                                            field.onChange(val);
                                          }}
                                          className={`w-full ${errors.estado_rol ? 'border-red-600' : 'border-gray-300'} rounded-lg p-2`}
                                        >
                                          <SelectItem key="1" value="1">Activo</SelectItem>
                                          <SelectItem key="0" value="0">Inactivo</SelectItem>
                                        </Select>
                                      )}
                                    />
                                    {errors.estado_rol && <p className="text-xs text-red-600">{errors.estado_rol.message}</p>}
                                </div>
                            </div>
                        </ModalBody>

                        <ModalFooter>
                            <Button auto flat color="error" onClick={onClose}>
                                Cerrar
                            </Button>
                            <Button auto type="submit" disabled={isSaveDisabled} color="primary">
                                Guardar
                            </Button>
                        </ModalFooter>
                    </form>
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
