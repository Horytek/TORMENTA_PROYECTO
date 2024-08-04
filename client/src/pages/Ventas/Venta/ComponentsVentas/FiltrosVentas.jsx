import React from "react";
import { useState,useEffect} from 'react';
import { GrDocumentWindows } from 'react-icons/gr';
import {DateRangePicker} from "@nextui-org/date-picker";
import useComprobanteData from '../../Data/data_comprobante_venta';
import useSucursalData from '../../Data/data_sucursal_venta';
import {parseDate} from "@internationalized/date";

const FiltrosVentas = ({onFiltersChange}) => {
    const {comprobantes} = useComprobanteData();
    const {sucursales} = useSucursalData();
    const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState('');
    const [sucursalSeleccionado, setSucursalSeleccionado] = useState('');
    const [value, setValue] = React.useState({
        start: parseDate("2024-04-01"),
        end: parseDate("2028-04-08"),
      });
      const [tempValue, setTempValue] = useState(value);
      const [razon, setRazon] = useState('');
      const handleChange = (event) => {
        setRazon(event.target.value);
      };
      
      const handleDateChange = (newValue) => {
        // Validar las fechas antes de actualizar el estado
        if (newValue.start && newValue.end) {
          setValue(newValue);
          setTempValue(newValue);
        } else {
          setTempValue(newValue);
        }
      };

      
    
      useEffect(() => {
        const date_i = new Date(value.start.year, value.start.month - 1, value.start.day);
        const fecha_i = `${date_i.getFullYear()}-${String(date_i.getMonth() + 1).padStart(2, '0')}-${String(date_i.getDate()).padStart(2, '0')}`;

        const date_e = new Date(value.end.year, value.end.month - 1, value.end.day);
        const fecha_e = `${date_e.getFullYear()}-${String(date_e.getMonth() + 1).padStart(2, '0')}-${String(date_e.getDate()).padStart(2, '0')}`;

        const filtros = {
            comprobanteSeleccionado,
            sucursalSeleccionado,
            fecha_i,
            fecha_e,
            razon,
        };

        onFiltersChange(filtros);
        localStorage.setItem('filtros', JSON.stringify(filtros));
    }, [comprobanteSeleccionado, sucursalSeleccionado, value, razon, onFiltersChange]);

    return (
        <>
        <div className="flex flex-wrap mb-4 justify-between">
            {/* Contenedor principal con filtros */}
            <div className="block ms:block md:flex lg:w-12/12 xl:8/12 items-center md:space-y-0 md:space-x-2 lg:space-x-15 md:flex-wrap justify-between">
                <div className="input-wrapper flex">
                    <input type="text" id="valor" className="input border border-gray-300 rounded-lg" placeholder="Nombre o Razón Social"
                    value={razon} // El valor del input se controla con useState
                    onChange={handleChange} />
                </div>
                <div className="input-wrapper mb-2 md:mb-0">
                    <select id="tipo" className="border border-gray-300 rounded-lg p-2" style={{width: "190px"}} value={comprobanteSeleccionado}
                                onChange={(e) => setComprobanteSeleccionado(e.target.value)}
                                                                    >
                        <option value="">Tipo Comprobante</option>
                        {comprobantes.map((comprobante, index) => (
                                        <option key={index} value={comprobante.nombre}>{comprobante.nombre}</option>
                                    ))}
                    </select>
                </div>
                <div className="input-wrapper mb-2 md:mb-0">
                    {/* <label htmlFor="campo" className="label">
                        Campo
                    </label> */}
                    <select id="campo" className="border border-gray-300 rounded-lg p-2" style={{width: "170px"}} value={sucursalSeleccionado}
                                onChange={(e) => setSucursalSeleccionado(e.target.value)}>
                        <option value="">Sucursal</option>
                        {sucursales.map((sucursal, index) => (
                                        <option key={index} value={sucursal.nombre}>{sucursal.nombre}</option>
                                    ))}
                    </select>
                </div>
                <div className="input-wrapper flex gap-2">
            <DateRangePicker
              className="w-xs"
              classNames={{ inputWrapper: "bg-white" }}
              value={tempValue}
              onChange={handleDateChange}
              // Deshabilitar la entrada manual de fecha
              renderInput={(props) => (
                <input {...props} className="border border-gray-300 rounded-lg p-2 bg-white" />
              )}
            />
          </div>
            </div>

            {/* Segundo div para botones de acción */}
            <div className="flex items-center xl:justify-end mt-3 md:mt-3 lg:mt-0 xl:mt-0">
                <button className="btn btn-exportar flex items-center mr-0">
                    <GrDocumentWindows className="inline-block mr-2" style={{ fontSize: '20px' }} />
                    Exportar
                </button>
            </div>
        </div>
    </>
    );
};

export default FiltrosVentas;
