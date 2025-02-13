import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
import ConfirmationModal from '@/pages/Almacen/Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';
import AgregarSucursal from './Modals/AgregarSucursal';

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
    const closeModalSucursal = () => {
        setIsModalOpenSucursal(false);

    };
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 mt-5 mb-4">
            <div className="flex items-center justify-between gap-4 w-full" >

                <div className="flex items-center gap-2">
                    <h6 className='font-bold'>Nombre:</h6>
                    <div className='relative'>
                        <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
                            <IoIosSearch className='w-4 h-4 text-gray-500' />
                        </div>
                        <input
                            type="text"
                            placeholder=''
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className='border border-gray-300 text-gray-900 text-sm rounded-lg pl-10 p-2 w-30'
                            style={{ width: '300px' }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <h6 className='font-bold'>Estado:</h6>
                    <select id=""
                        className='border border-gray-300 text-center text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500'
                        onChange={(e) => setEstado(e.target.value)} value={estado}
                        style={{ width: '110px' }}>
                        <option value="%">...</option>
                        <option value="1">Activo</option>
                        <option value="0">Inactivo</option>
                    </select>
                </div>
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button" onClick={openModalSucursal}
                >
                    <FaPlus className="inline-block mr-2 text-lg" /> Nueva sucursal
                </button>
            </div>
            <AgregarSucursal isOpen={isModalOpenSucursal} onClose={closeModalSucursal} titulo={'Agregar'} />

        </div>
    );
};

export default FiltrosSucursal;
