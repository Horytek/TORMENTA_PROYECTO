import React, { useState, useEffect } from "react";
import useSucursalData from '../../data/data_sucursal_guia';
import { FaSearch } from 'react-icons/fa';
import { DateRangePicker } from "@nextui-org/date-picker";
import { parseDate } from "@internationalized/date";

const FiltrosGuias = ({ onFiltersChange }) => {
    const { sucursales } = useSucursalData();
    const [value, setValue] = useState({
        start: parseDate("2024-04-01"),
        end: parseDate("2028-04-08"),
    });
    const [sucursalSeleccionado, setSucursalSeleccionado] = useState('');
    const [numGuia, setNumGuia] = useState('');
    const [dni, setDni] = useState('');

    // Filtros locales
    const [localFilters, setLocalFilters] = useState({
        sucursalSeleccionado: '',
        fecha_i: `${value.start.year}-${String(value.start.month).padStart(2, '0')}-${String(value.start.day).padStart(2, '0')}`,
        fecha_e: `${value.end.year}-${String(value.end.month).padStart(2, '0')}-${String(value.end.day).padStart(2, '0')}`,
        numGuia: '',
        dni: ''
    });

    const handleNumGuiaChange = (event) => {
        setNumGuia(event.target.value);
        setLocalFilters(prev => ({ ...prev, numGuia: event.target.value }));
    };

    const handleDniChange = (event) => {
        setDni(event.target.value);
        setLocalFilters(prev => ({ ...prev, dni: event.target.value }));
    };

    const handleSucursalChange = (event) => {
        setSucursalSeleccionado(event.target.value);
        setLocalFilters(prev => ({ ...prev, sucursalSeleccionado: event.target.value }));
    };

    useEffect(() => {
        const date_i = new Date(value.start.year, value.start.month - 1, value.start.day);
        const fecha_i = `${date_i.getFullYear()}-${String(date_i.getMonth() + 1).padStart(2, '0')}-${String(date_i.getDate()).padStart(2, '0')}`;

        const date_e = new Date(value.end.year, value.end.month - 1, value.end.day);
        const fecha_e = `${date_e.getFullYear()}-${String(date_e.getMonth() + 1).padStart(2, '0')}-${String(date_e.getDate()).padStart(2, '0')}`;

        setLocalFilters(prev => ({ ...prev, fecha_i, fecha_e }));

        const debounce = setTimeout(() => {
            const filtrosG = {
                sucursalSeleccionado: localFilters.sucursalSeleccionado,
                fecha_i,
                fecha_e,
                numGuia: localFilters.numGuia,
                dni: localFilters.dni,
            };

            onFiltersChange(filtrosG);
            localStorage.setItem('filtrosGuia', JSON.stringify(filtrosG));
        }, 500); // Ajusta el tiempo de debounce según sea necesario

        return () => clearTimeout(debounce);
    }, [value, localFilters, onFiltersChange]);

    return (
        <div className="flex flex-wrap mb-4 justify-between">
            {/* Contenedor principal con filtros */}
            <div className="block ms:block md:flex lg:w-12/12 xl:8/12 items-center md:space-y-0 md:space-x-2 lg:space-x-15 md:flex-wrap justify-between">
                <div className="input-wrapper flex">
                    <input type="text" id="numGuia" className="input-d" placeholder="Número de guía"
                        value={numGuia}
                        onChange={handleNumGuiaChange} />
                </div>
                <div className="input-wrapper flex">
                    <input type="text" id="dni" className="input-d" placeholder="DNI o RUC"
                        value={dni}
                        onChange={handleDniChange} />
                </div>
                <div className="input-wrapper flex gap-2">
                    <DateRangePicker 
                        className="w-xs"
                        classNames={{ inputWrapper: "bg-white" }}
                        value={value} onChange={setValue}
                    />
                </div>
                <div className="input-wrapper mb-2 md:mb-0">
                    <select id="vend" className="input-d" style={{ width: "170px" }} onChange={handleSucursalChange}>
                        <option value="%">Seleccione...</option>
                        {sucursales.map((sucursal, index) => (
                            <option key={index} value={sucursal.id}>{sucursal.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default FiltrosGuias;
