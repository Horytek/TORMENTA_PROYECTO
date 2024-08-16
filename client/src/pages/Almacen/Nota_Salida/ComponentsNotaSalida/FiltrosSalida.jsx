import React, { useState, useEffect, useCallback } from 'react';
import { DateRangePicker } from "@nextui-org/date-picker";
import { parseDate } from "@internationalized/date";
import { ButtonIcon } from '@/components/Buttons/Buttons';
import { Link } from 'react-router-dom';
import { FaPlus } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
import ConfirmationModal from '@/pages/Almacen/Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';

const FiltrosSalida = ({ almacenes = [], onAlmacenChange, onFiltersChange, onPDFOptionClick }) => {
    const [almacenSeleccionado, setAlmacenSeleccionado] = useState(() => {
        const almacenIdGuardado = localStorage.getItem('almacen');
        return almacenIdGuardado ? almacenes.find(a => a.id === parseInt(almacenIdGuardado)) || { id: '%', sucursal: '' } : { id: '%', sucursal: '' };
    });
    const [estado, setEstado] = useState('');
    useEffect(() => {
        const almacenIdGuardado = localStorage.getItem('almacen');
        if (almacenIdGuardado && almacenes.length > 0) {
            const almacen = almacenes.find(a => a.id === parseInt(almacenIdGuardado));
            if (almacen) {
                setAlmacenSeleccionado(almacen);
            }
        }
    }, [almacenes]);

    const [isModalOpenImprimir, setIsModalOpenImprimir] = useState(false);
    const [isModalOpenPDF, setIsModalOpenPDF] = useState(false);

    const [value, setValue] = useState({
        start: parseDate("2024-04-01"),
        end: parseDate("2028-04-08"),
    });

    const [razon, setRazon] = useState('');
    const [usuario, setUsuario] = useState('');
    const [documento, setDocumento] = useState('');

    const applyFilters = useCallback(() => {
        const date_i = `${value.start.year}-${String(value.start.month).padStart(2, '0')}-${String(value.start.day).padStart(2, '0')}`;
        const date_e = `${value.end.year}-${String(value.end.month).padStart(2, '0')}-${String(value.end.day).padStart(2, '0')}`;

        const filtros = {
            fecha_i: date_i,
            fecha_e: date_e,
            razon_social: razon,
            almacen: almacenSeleccionado.id !== '%' ? almacenSeleccionado.id : '%',
            usuario: usuario,
            documento: documento,
            estado: estado !== '%' ? estado : '%'
        };

        onFiltersChange(filtros);
    }, [value, razon, almacenSeleccionado, usuario, documento, estado, onFiltersChange]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    const handleAlmacenChange = (event) => {
        const almacen = event.target.value === '%' ? { id: '%', sucursal: '' } : almacenes.find(a => a.id === parseInt(event.target.value));
        setAlmacenSeleccionado(almacen);
        localStorage.setItem('almacen', almacen.id);
        onAlmacenChange(almacen);
    };

    const openModalImprimir = () => {
        setIsModalOpenImprimir(true);
    };

    const closeModalImprimir = () => {
        setIsModalOpenImprimir(false);
    };

    const openModalPDF = () => {
        setIsModalOpenPDF(true);
    };

    const closeModalPDF = () => {
        setIsModalOpenPDF(false);
    };


    const handleConfirmImprimir = () => {
        console.log('Nota de salida impresa.');
        setIsModalOpenImprimir(false);
    };

    const handleConfirmPDF = () => {
        console.log('Exportar a PDF.');
        setIsModalOpenPDF(false);
    };

    const handleSelectChange = (event) => {
        const value = event.target.value;
        if (value === "pdf") {
            onPDFOptionClick();
        }
        event.target.value = '';
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 mt-5 mb-4">
            <div className="flex items-center justify-between gap-4 w-full" >
                <div className="flex items-center gap-2">
                    <h6 className='font-bold'>Almacén:</h6>
                    <select id="almacen" className='border border-gray-300 p-2 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-4 w-56' onChange={handleAlmacenChange} value={almacenSeleccionado.id}>
                        <option value="%">Seleccione...</option>
                        {almacenes.map((almacen, index) => (
                            <option key={index} value={almacen.id}>{almacen.almacen}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <h6 className='font-bold'>Nombre o razón social:</h6>
                    <div className='relative'>
                        <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
                            <IoIosSearch className='w-4 h-4 text-gray-500' />
                        </div>
                        <input
                            type="text"
                            placeholder='Ej: Juan Perez o Empresa SA'
                            value={razon}
                            onChange={(e) => setRazon(e.target.value)}
                            className='border border-gray-300 text-gray-900 text-sm rounded-lg pl-10 p-2 w-30'
                            style={{ width: '300px' }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <h6 className='font-bold'>Comprobante:</h6>
                    <div className='relative'>
                        <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
                            <IoIosSearch className='w-4 h-4 text-gray-500' />
                        </div>
                        <input
                            type="text"
                            placeholder='Ej: S400-00000000'
                            value={documento}
                            onChange={(e) => setDocumento(e.target.value)}
                            className='border border-gray-300 text-gray-900 text-sm rounded-lg pl-10 p-2 w-auto'
                            style={{ width: '175px' }}
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 w-full" >
                <div className="flex items-center gap-2">
                    <h6 className='font-bold'>Fecha:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</h6>
                    <DateRangePicker
                        className="w-xs"
                        classNames={{ inputWrapper: "bg-white" }}
                        value={value}
                        onChange={setValue}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <h6 className='font-bold'>Estado:</h6>
                    <select id=""
                        className='border border-gray-300 text-center text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500'
                        onChange={(e) => setEstado(e.target.value)} value={estado}
                        style={{ width: '110px' }}>
                        <option value="%">...</option>
                        <option value="0">Activo</option>
                        <option value="1">Inactivo</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <h6 className='font-bold'>Usuario:</h6>
                    <div className='relative'>
                        <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
                            <IoIosSearch className='w-4 h-4 text-gray-500' />
                        </div>
                        <input
                            type="text"
                            placeholder='Ej: tormenta'
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                            className='border border-gray-300 text-gray-900 text-sm rounded-lg pl-10 p-2 w-30'
                            style={{ width: '180px' }}
                        />
                    </div>
                </div>



                <div className="flex items-center gap-2">
                    <div className='flex items-center gap-2'>
                        <select className='b text-center custom-select border border-gray-300 rounded-lg p-2.5 text-gray-900 text-sm w-full'
                            name="select" onChange={handleSelectChange} style={{ width: '100px' }}>
                            <option value="">...</option>
                            <option value="pdf">PDF</option>
                            {/* <option value="imprimir">Imprimir</option> */}
                        </select>
                    </div>

                    <Link to="/almacen/nota_salida/nueva_nota_salida">
                        <ButtonIcon color={'#4069E4'} icon={<FaPlus style={{ fontSize: '20px' }} />}>
                            Nota de salida
                        </ButtonIcon>
                    </Link>
                </div>
            </div>
            {isModalOpenImprimir && (
                <ConfirmationModal
                    message='¿Desea imprimir la nota de salida?'
                    onClose={closeModalImprimir}
                    isOpen={isModalOpenImprimir}
                    onConfirm={handleConfirmImprimir}
                />
            )}
            {isModalOpenPDF && (
                <ConfirmationModal
                    message='¿Desea exportar a PDF?'
                    onClose={closeModalPDF}
                    isOpen={isModalOpenPDF}
                    onConfirm={handleConfirmPDF}
                />
            )}
        </div>
    );
};

export default FiltrosSalida;
