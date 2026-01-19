import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { toast } from "react-hot-toast";
import { TiDelete } from "react-icons/ti";
import { FaCheckCircle } from "react-icons/fa";
import { useForm, Controller } from "react-hook-form";
import { getSucursales, addAlmacen, updateAlmacen } from '@/services/almacen.services';
import {
    Input,
    Button,
    Chip
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
import ConfirmationModal from "@/components/Modals/ConfirmationModal";

const AlmacenForm = ({ modalTitle, onClose, initialData, onSuccess }) => {
    const [sucursales, setSucursales] = useState([]);
    const [isOpen, setIsOpen] = useState(true);

    const { control, handleSubmit, formState: { errors }, reset, watch } = useForm({
        defaultValues: initialData?.data
            ? { ...initialData.data, id_sucursal: initialData.data.id_sucursal?.toString() || "" }
            : {
                nom_almacen: '',
                id_sucursal: '',
                ubicacion: '',
                estado_almacen: '',
            }
    });

    useEffect(() => {
        fetchSucursales();
    }, []);

    useEffect(() => {
        if (initialData && sucursales.length > 0) {
            reset({
                ...initialData.data,
                id_sucursal: initialData.data.id_sucursal?.toString() || "",
            });
        }
    }, [initialData, sucursales, reset]);

    const fetchSucursales = async () => {
        const data = await getSucursales();
        setSucursales(data);
    };

    const [almacenGlobal] = useState(() => {
        try {
            // Intenta leer del localStorage directamente para sincronización inmediata
            const stored = localStorage.getItem('almacen-storage');
            return stored ? JSON.parse(stored).state.almacen : "%";
        } catch {
            return "%";
        }
    });

    useEffect(() => {
        if (!initialData && sucursales.length > 0 && almacenGlobal && almacenGlobal !== "%") {
            // Buscar si la sucursal global existe y está disponible
            const currentSucursal = sucursales.find(s => s.id_sucursal.toString() === almacenGlobal && s.disponible);
            if (currentSucursal) {
                reset({
                    ...watch(),
                    id_sucursal: currentSucursal.id_sucursal.toString()
                });
            }
        }
    }, [sucursales, initialData, almacenGlobal, reset]);

    const selectedSucursalId = watch('id_sucursal');
    const selectedSucursal = sucursales.find(sucursal =>
        sucursal.id_sucursal === parseInt(selectedSucursalId)
    );

    const [confirmModalData, setConfirmModalData] = useState(null);

    const handlePreSubmit = (data) => {
        const { id_sucursal } = data;
        const selectedSucursalId = parseInt(id_sucursal);
        const sucursalInfo = sucursales.find(s => s.id_sucursal === selectedSucursalId);

        const isCurrentlyAssignedToThis = initialData?.data?.id_sucursal === selectedSucursalId;

        // Si la sucursal no está disponible Y no es la misma que ya tenía asignada este almacén
        if (sucursalInfo && !sucursalInfo.disponible && !isCurrentlyAssignedToThis) {
            setConfirmModalData({
                isOpen: true,
                title: "Sucursal Ocupada",
                message: `La sucursal "${sucursalInfo.nombre_sucursal}" ya está asignada a otro almacén. ¿Deseas realizar el intercambio y asignarla a este almacén? El almacén anterior quedará sin sucursal asignada.`,
                data: data
            });
            return;
        }

        // Si no hay conflicto, guardar normal
        onSubmit(data);
    };

    const onSubmit = async (data, force_exchange = false) => {
        try {
            const { nom_almacen, id_sucursal, ubicacion, estado_almacen } = data;
            const idSucursalNumber = id_sucursal ? parseInt(id_sucursal, 10) : null;
            if (!idSucursalNumber) {
                toast.error("Seleccione una sucursal válida");
                return;
            }
            const newAlmacen = {
                nom_almacen,
                id_sucursal: idSucursalNumber,
                ubicacion,
                estado_almacen: parseInt(estado_almacen),
                force_exchange
            };

            let result;
            if (initialData) {
                result = await updateAlmacen(parseInt(initialData?.data?.id_almacen), newAlmacen);
                if (result && onSuccess) {
                    onSuccess({ ...newAlmacen, id_almacen: initialData.data.id_almacen });
                }
            } else {
                result = await addAlmacen(newAlmacen);
                if (result && onSuccess) {
                    onSuccess({
                        ...newAlmacen,
                        id_almacen: result.id_almacen,
                        nombre_sucursal: sucursales.find(s => s.id_sucursal === newAlmacen.id_sucursal)?.nombre_sucursal || ""
                    });
                }
            }

            if (result) {
                toast.success(initialData ? "Almacén actualizado correctamente" : "Almacén creado correctamente");
                handleCloseModal();
            }
        } catch (error) {
            // Si el error es 409 (Conflicto) y no enviamos force_exchange, podríamos manejarlo aquí también,
            // pero ya lo manejamos en el pre-submit.
            if (error.response?.status === 409) {
                toast.error("Conflicto: La sucursal ya está ocupada.");
            } else {
                toast.error("Error al gestionar el almacén");
            }
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
                className="z-[9999]"
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
                                            name="nom_almacen"
                                            control={control}
                                            rules={{ required: "El nombre del almacén es requerido" }}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    label="Nombre Almacén"
                                                    variant="faded"
                                                    color={errors.nom_almacen ? "danger" : "default"}
                                                    errorMessage={errors.nom_almacen?.message}
                                                    isRequired
                                                />
                                            )}
                                        />
                                    </div>

                                    <div className="col-span-1">
                                        <Controller
                                            name="id_sucursal"
                                            control={control}
                                            rules={{ required: "La sucursal es requerida" }}
                                            render={({ field }) => (
                                                <Select
                                                    label="Sucursal"
                                                    variant="faded"
                                                    placeholder="Seleccione una sucursal"
                                                    selectedKeys={field.value ? [field.value.toString()] : []}
                                                    onSelectionChange={(keys) => {
                                                        const value = Array.from(keys)[0] || "";
                                                        field.onChange(value);
                                                    }}
                                                    isRequired
                                                    color={errors.id_sucursal ? "danger" : "default"}
                                                    errorMessage={errors.id_sucursal?.message}
                                                >
                                                    {sucursales.map((sucursal) => {
                                                        const isUsed = initialData?.data?.id_sucursal === sucursal.id_sucursal;
                                                        const isDisabled = !sucursal.disponible;

                                                        return (
                                                            <SelectItem
                                                                key={sucursal.id_sucursal.toString()}
                                                                value={sucursal.id_sucursal.toString()}
                                                                description={isDisabled ? (isUsed ? "En uso (Actual)" : "Ocupado - Seleccionar para intercambiar") : "Disponible"}
                                                                className={isDisabled && !isUsed ? "text-amber-600" : ""}
                                                                textValue={sucursal.nombre_sucursal}
                                                            >
                                                                {sucursal.nombre_sucursal}
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </Select>
                                            )}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="col-span-1">
                                        <Controller
                                            name="ubicacion"
                                            control={control}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    label="Ubicación"
                                                    variant="faded"
                                                />
                                            )}
                                        />
                                    </div>

                                    <div className="col-span-1">
                                        <Controller
                                            name="estado_almacen"
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
                                                    color={errors.estado_almacen ? "danger" : "default"}
                                                    errorMessage={errors.estado_almacen?.message}
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
                                    onPress={handleSubmit(handlePreSubmit)}
                                >
                                    Guardar
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Confirmation Modal for Exchange */}
            {confirmModalData && (
                <ConfirmationModal
                    isOpen={confirmModalData.isOpen}
                    onClose={() => setConfirmModalData(null)}
                    onConfirm={() => {
                        onSubmit(confirmModalData.data, true); // force_exchange = true
                        setConfirmModalData(null);
                    }}
                    title={confirmModalData.title}
                    message={confirmModalData.message}
                    confirmText="Intercambiar"
                    cancelText="Cancelar"
                    color="warning"
                />
            )}
        </>
    );
};

AlmacenForm.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    initialData: PropTypes.object,
    onSuccess: PropTypes.func
};

export default AlmacenForm;
