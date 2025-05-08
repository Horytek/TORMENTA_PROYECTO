import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Toaster, toast } from "react-hot-toast";
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
  } from "@nextui-org/react";

const AlmacenForm = ({ modalTitle, onClose, initialData }) => {
    const [sucursales, setSucursales] = useState([]);
    const [isOpen, setIsOpen] = useState(true);
    
    const { control, handleSubmit, formState: { errors }, reset, watch } = useForm({
        defaultValues: initialData?.data || {
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
            reset(initialData.data);
        }
    }, [initialData, sucursales, reset]);

    const fetchSucursales = async () => {
        const data = await getSucursales();
        setSucursales(data);
    };

    const selectedSucursalId = watch('id_sucursal');
    const selectedSucursal = sucursales.find(sucursal => 
        sucursal.id_sucursal === parseInt(selectedSucursalId)
    );

    const onSubmit = async (data) => {
        try {
            const { nom_almacen, id_sucursal, ubicacion, estado_almacen } = data;
            const newAlmacen = {
                nom_almacen,
                id_sucursal: id_sucursal ? parseInt(id_sucursal) : null,
                ubicacion,
                estado_almacen: parseInt(estado_almacen)
            };

            let result;
            if (initialData) {
                result = await updateAlmacen(parseInt(initialData?.data?.id_almacen), newAlmacen);
            } else {
                result = await addAlmacen(newAlmacen);
            }

            if (result) {
                toast.success(initialData ? "Almacén actualizado correctamente" : "Almacén creado correctamente");
                handleCloseModal();
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } catch (error) {
            toast.error("Error al gestionar el almacén");
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
                                            name="nom_almacen"
                                            control={control}
                                            rules={{ required: "El nombre del almacén es requerido" }}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    label="Nombre Almacén"
                                                    variant="bordered"
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
                                            render={({ field }) => (
                                                <Select
                                                    {...field}
                                                    label="Sucursal"
                                                    variant="bordered"
                                                    placeholder="Seleccione una sucursal"
                                                    selectedKeys={field.value ? [field.value.toString()] : []}
                                                    onChange={(e) => field.onChange(e.target.value)}
                                                >
                                                    {sucursales.map((sucursal) => (
                                                        <SelectItem 
                                                            key={sucursal.id_sucursal.toString()} 
                                                            value={sucursal.id_sucursal.toString()}
                                                        >
                                                            {sucursal.nombre_sucursal} {initialData?.data?.id_sucursal === sucursal.id_sucursal ? "- (En uso)" : ""}
                                                        </SelectItem>
                                                    ))}
                                                </Select>
                                            )}
                                        />
                                        {selectedSucursal && (
                                            <div className="flex items-center mt-2">
                                                <Chip
                                                    startContent={selectedSucursal.disponible ? 
                                                        <FaCheckCircle className="text-green-500" /> : 
                                                        <TiDelete className="text-danger" />
                                                    }
                                                    color={selectedSucursal.disponible ? "success" : "danger"}
                                                    variant="flat"
                                                >
                                                    {selectedSucursal.disponible ? "Disponible" : "No disponible"}
                                                </Chip>
                                            </div>
                                        )}
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
                                                    variant="bordered"
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
                                                    variant="bordered"
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

AlmacenForm.propTypes = {
    modalTitle: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    initialData: PropTypes.object
};

export default AlmacenForm;
