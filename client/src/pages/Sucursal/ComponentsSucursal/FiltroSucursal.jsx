import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
import { Button, Input, Select, SelectItem } from '@nextui-org/react';
import AgregarSucursal from './Modals/AgregarSucursal';
import { usePermisos } from '@/routes';



const FiltrosSucursal = ({ onFiltersChange }) => {
    const [estado, setEstado] = useState('');
    const [nombre, setNombre] = useState('');
    const [isModalOpenSucursal, setIsModalOpenSucursal] = useState(false);

    const applyFilters = useCallback(() => {
        const filtros = {
            nombre: nombre,
            estado: estado !== '%' ? estado : '%'
        };

        onFiltersChange(filtros);
    }, [nombre, estado, onFiltersChange]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    const openModalSucursal = () => {
        setIsModalOpenSucursal(true);
    };

    const { hasCreatePermission } = usePermisos();


    const closeModalSucursal = () => {
        setIsModalOpenSucursal(false);
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 mt-5 mb-4">
            <div className="flex items-center justify-between gap-4 w-full">
                <div className="flex items-center gap-2">
                    <h6 className='font-bold'>Nombre:</h6>
                    <div className='relative'>
                        <Input
                            type="text"
                            placeholder='Buscar nombre'
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            startContent={<IoIosSearch className='text-gray-500' />}
                            className='w-72'
                            style={{
                                border: "none",
                                boxShadow: "none",
                                outline: "none",
                            }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <h6 className='font-bold'>Estado:</h6>
                    <Select
                        aria-label="Estado"
                        placeholder="Seleccionar estado"
                        selectedKeys={[estado]}
                        onSelectionChange={(keys) => setEstado(Array.from(keys)[0])}
                        className="w-32"
                    >
                        <SelectItem key="%">...</SelectItem>
                        <SelectItem key="1">Activo</SelectItem>
                        <SelectItem key="0">Inactivo</SelectItem>
                    </Select>
                </div>

                <Button color="primary"
                    onPress={hasCreatePermission ? openModalSucursal : undefined}
                    endContent={<FaPlus style={{ fontSize: '25px' }} />}
                    disabled={!hasCreatePermission}
                    className={`flex items-center gap-2 ${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                     Agregar sucursal 
                </Button>
            </div>
            <AgregarSucursal isOpen={isModalOpenSucursal} onClose={closeModalSucursal} titulo={'Agregar'} />
        </div>
    );
};

export default FiltrosSucursal;