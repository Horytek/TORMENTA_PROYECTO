import { useState, useEffect, useCallback } from "react";
import useSucursalData from '../../data/data_sucursal_guia';
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
    const [documento, setDocumento] = useState('');

    const handleNumGuiaChange = (event) => {
        setNumGuia(event.target.value);
    };

    const handleDocumentoChange = (event) => {
        setDocumento(event.target.value);
    };

    const handleSucursalChange = (event) => {
        setSucursalSeleccionado(event.target.value);
    };

    const handleFiltersChange = useCallback(() => {
        const date_i = new Date(value.start.year, value.start.month - 1, value.start.day);
        const fecha_i = `${date_i.getFullYear()}-${String(date_i.getMonth() + 1).padStart(2, '0')}-${String(date_i.getDate()).padStart(2, '0')}`;

        const date_e = new Date(value.end.year, value.end.month - 1, value.end.day);
        const fecha_e = `${date_e.getFullYear()}-${String(date_e.getMonth() + 1).padStart(2, '0')}-${String(date_e.getDate()).padStart(2, '0')}`;

        const filtrosG = {
            sucursalSeleccionado,
            fecha_i,
            fecha_e,
            numGuia,
            documento,
        };

        onFiltersChange(filtrosG);
        localStorage.setItem('filtrosGuia', JSON.stringify(filtrosG));
    }, [sucursalSeleccionado, value, numGuia, documento, onFiltersChange]);

    useEffect(() => {
        handleFiltersChange();
    }, [handleFiltersChange]);

    return (
        <div className="flex flex-wrap mb-4 justify-between">
            <div className="block ms:block md:flex lg:w-12/12 xl:8/12 items-center md:space-y-0 md:space-x-2 lg:space-x-15 md:flex-wrap justify-between">
                <div className="input-wrapper flex">
                    <input type="text" id="numGuia" className="input border border-gray-300 rounded-lg" placeholder="Número de guía"
                        value={numGuia}
                        onChange={handleNumGuiaChange} />
                </div>
                <div className="input-wrapper flex">
                    <input type="text" id="documento" className="input border border-gray-300 rounded-lg" placeholder="Documento o RUC"
                        value={documento}
                        onChange={handleDocumentoChange} />
                </div>
                <div className="input-wrapper flex gap-2">
                    <DateRangePicker 
                        className="w-xs"
                        classNames={{ inputWrapper: "bg-white" }}
                        value={value} onChange={setValue}
                    />
                </div>
                <div className="input-wrapper mb-2 md:mb-0">
                    {/* <label htmlFor="campo" className="label">
                        Campo
                    </label> */}
                    <select id="campo" className="border border-gray-300 rounded-lg" style={{width: "170px"}} value={sucursalSeleccionado}
                                onChange={(e) => setSucursalSeleccionado(e.target.value)}>
                        <option value="" selected>Sucursal</option>
                        {sucursales.map((sucursal, index) => (
                                        <option key={index} value={sucursal.nombre}>{sucursal.nombre}</option>
                                    ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default FiltrosGuias;
