import React from "react";
import { Link } from 'react-router-dom';
import { MdAddCircleOutline } from 'react-icons/md';
import { useState,useEffect} from 'react';
import {DateRangePicker} from "@nextui-org/date-picker";
import useComprobanteData from '../../Data/data_comprobante_venta';
import useSucursalData from '../../Data/data_sucursal_venta';
import {parseDate} from "@internationalized/date";
import {Select, SelectItem} from "@nextui-org/react";
import {Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar} from "@nextui-org/react";
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";
import { RiFileExcel2Line } from "react-icons/ri";

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
        <div className="flex flex-wrap justify-between mb-4">
            {/* Contenedor principal con filtros */}
            <div className="items-center justify-between block ms:block md:flex lg:w-12/12 xl:8/12 md:space-y-0 md:space-x-2 lg:space-x-15 md:flex-wrap">
                <div className="flex input-wrapper">
                    <input type="text" id="valor" className="border border-gray-300 rounded-lg input" placeholder="Nombre o Razón Social"
                    value={razon} // El valor del input se controla con useState
                    onChange={handleChange} />
                </div>
                <div className="mb-2 input-wrapper md:mb-0">
                    <Select id="tipo" placeholder="Tipo Comprobante" className="p-0 rounded-lg" style={{width: "190px"}} value={comprobanteSeleccionado}
                                onChange={(e) => setComprobanteSeleccionado(e.target.value)}
                                                                    >
                        {comprobantes.map((comprobante) => (
                                        <SelectItem key={comprobante.id} value={comprobante.nombre}>{comprobante.nombre}</SelectItem>
                                    ))}
                    </Select>
                </div>
                <div className="mb-2 input-wrapper md:mb-0">
                    {/* <label htmlFor="campo" className="label">
                        Campo
                    </label> */}
                    <Select id="campo" placeholder="Sucursal" selectionMode="multiple" className="p-2 rounded-lg" style={{width: "170px"}} value={sucursalSeleccionado}
                                onChange={(e) => setSucursalSeleccionado(e.target.value)}>
                        {sucursales.map((sucursal) => (
                                        <SelectItem key={sucursal.nombre} value={sucursal.nombre}>{sucursal.nombre}</SelectItem>
                                    ))}
                    </Select>
                </div>
                <div className="flex gap-2 input-wrapper">
            <DateRangePicker
              className="w-xs"
              classNames={{ inputWrapper: "bg-white" }}
              value={tempValue}
              onChange={handleDateChange}
              // Deshabilitar la entrada manual de fecha
              renderInput={(props) => (
                <input {...props} className="p-2 bg-white border border-gray-300 rounded-lg" />
              )}
            />
          </div>
            </div>

            {/* Segundo div para botones de acción */}
            <div className="flex items-center mt-3 xl:justify-end md:mt-3 lg:mt-0 xl:mt-0">
              <button className="mr-4">
              <Dropdown>
                <DropdownTrigger className="bg-gray-100">
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform"
                  icon={<PiMicrosoftExcelLogoFill className="text-xl"/>}
                />
                </DropdownTrigger>
                <DropdownMenu variant="faded" aria-label="Dropdown menu with icons">
                  <DropdownItem key="diario" startContent={<RiFileExcel2Line />} >
                    Excel C/ Quiebre diario
                  </DropdownItem>
                  <DropdownItem key="diario" startContent={<RiFileExcel2Line />} >
                    Excel Listado General
                  </DropdownItem>
                  <DropdownItem key="diario" startContent={<RiFileExcel2Line />} >
                    Excel por Comprobante
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
              </button>
            <Link to="/ventas/registro_venta" className="mr-0 btn btn-nueva-venta">
              <MdAddCircleOutline className="inline-block mr-2" style={{ fontSize: '25px' }} />
              Nueva venta
            </Link>
            </div>
        </div>
    </>
    );
};

export default FiltrosVentas;
