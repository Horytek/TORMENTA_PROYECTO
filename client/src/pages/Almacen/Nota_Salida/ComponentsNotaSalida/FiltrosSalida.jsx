import { useState, useEffect, useCallback } from 'react';
import { DateRangePicker } from "@nextui-org/date-picker";
import { parseDate } from "@internationalized/date";
import { ButtonIcon } from '@/components/Buttons/Buttons';
import { Link } from 'react-router-dom';
import { FaPlus } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
import ConfirmationModal from '@/pages/Almacen/Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';

const FiltrosSalida = ({ almacenes = [], onAlmacenChange, onFiltersChange }) => {
    const [almacenSeleccionado, setAlmacenSeleccionado] = useState(() => {
        const almacenIdGuardado = localStorage.getItem('almacen');
        return almacenIdGuardado ? almacenes.find(a => a.id === parseInt(almacenIdGuardado)) || { id: '%', sucursal: '' } : { id: '%', sucursal: '' };
    });

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
    const [isModalOpenExcel, setIsModalOpenExcel] = useState(false);
    const [isModalOpenExcelDetalle, setIsModalOpenExcelDetalle] = useState(false);

    const [value, setValue] = useState({
        start: parseDate("2024-04-01"),
        end: parseDate("2028-04-08"),
    });

    const [razon, setRazon] = useState('');

    const applyFilters = useCallback(() => {
        const date_i = `${value.start.year}-${String(value.start.month).padStart(2, '0')}-${String(value.start.day).padStart(2, '0')}`;
        const date_e = `${value.end.year}-${String(value.end.month).padStart(2, '0')}-${String(value.end.day).padStart(2, '0')}`;

        const filtros = {
            fecha_i: date_i,
            fecha_e: date_e,
            razon_social: razon,
            almacen: almacenSeleccionado.id !== '%' ? almacenSeleccionado.id : '%',
        };

        onFiltersChange(filtros);
    }, [value, razon, almacenSeleccionado, onFiltersChange]);

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

    const openModalExcel = () => {
        setIsModalOpenExcel(true);
    };

    const closeModalExcel = () => {
        setIsModalOpenExcel(false);
    };

    const openModalExcelDetalle = () => {
        setIsModalOpenExcelDetalle(true);
    };

    const closeModalExcelDetalle = () => {
        setIsModalOpenExcelDetalle(false);
    };

    const handleConfirmImprimir = () => {
        console.log('Nota de salida impresa.');
        setIsModalOpenImprimir(false);
    };

    const handleConfirmExcel = () => {
        console.log('Exportar a Excel.');
        setIsModalOpenExcel(false);
    };

    const handleConfirmExcelDetalle = () => {
        console.log('Exportar a Excel Detalle.');
        setIsModalOpenExcelDetalle(false);
    };

    const handleSelectChange = (event) => {
        const value = event.target.value;
        if (value === "imprimir") {
            openModalImprimir();
        } else if (value === "excel") {
            openModalExcel();
        } else if (value === "excel-detalle") {
            openModalExcelDetalle();
        }
        event.target.value = '';
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 mt-5 mb-4">
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
                        placeholder=''
                        value={razon}
                        onChange={(e) => setRazon(e.target.value)}
                        className='border border-gray-300 text-gray-900 text-sm rounded-lg pl-10 p-2 w-30'
                    />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <DateRangePicker
                    className="w-xs"
                    classNames={{ inputWrapper: "bg-white" }}
                    value={value}
                    onChange={setValue}
                />
            </div>
            <div className="flex items-center gap-2">
                <div className='flex items-center gap-2'>
                    <select className='b text-center custom-select border border-gray-300 rounded-lg p-2.5 text-gray-900 text-sm w-full' name="select" onChange={handleSelectChange}>
                        <option value="">...</option>
                        <option value="imprimir">Imprimir</option>
                        <option value="excel">Excel</option>
                        <option value="excel-detalle">Excel Detalle</option>
                    </select>
                </div>
                <Link to="/almacen/nota_salida/nueva_nota_salida">
                    <ButtonIcon color={'#4069E4'} icon={<FaPlus style={{ fontSize: '25px' }} />}>
                        Nota de salida
                    </ButtonIcon>
                </Link>
            </div>
            {isModalOpenImprimir && (
                <ConfirmationModal
                    message='¿Desea imprimir la nota de salida?'
                    onClose={closeModalImprimir}
                    isOpen={isModalOpenImprimir}
                    onConfirm={handleConfirmImprimir}
                />
            )}
            {isModalOpenExcel && (
                <ConfirmationModal
                    message='¿Desea exportar a Excel?'
                    onClose={closeModalExcel}
                    isOpen={isModalOpenExcel}
                    onConfirm={handleConfirmExcel}
                />
            )}
            {isModalOpenExcelDetalle && (
                <ConfirmationModal
                    message='¿Desea exportar a Excel Detalle?'
                    onClose={closeModalExcelDetalle}
                    isOpen={isModalOpenExcelDetalle}
                    onConfirm={handleConfirmExcelDetalle}
                />
            )}
        </div>
    );
};

export default FiltrosSalida;
