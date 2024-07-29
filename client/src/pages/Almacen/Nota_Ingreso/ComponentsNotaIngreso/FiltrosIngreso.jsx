import React, { useState, useEffect } from 'react';
import { DateRangePicker } from "@nextui-org/date-picker";
import { parseDate } from "@internationalized/date";
import useAlmacenData from '../data/data_almacen_ingreso';
import { ButtonNormal, ButtonIcon } from '@/components/Buttons/Buttons';
import { Link } from 'react-router-dom';
import { LuFilter } from "react-icons/lu";
import { FaPlus } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
const FiltrosIngresos = ({ onAlmacenChange }) => {
    const { almacenes } = useAlmacenData();
    const [almacenSeleccionado, setAlmacenSeleccionado] = useState('');
    const [value, setValue] = useState({
        start: parseDate("2024-04-01"),
        end: parseDate("2028-04-08"),
    });

    const handleAlmacenChange = (event) => {
        const almacen = almacenes.find(a => a.id === parseInt(event.target.value));
        setAlmacenSeleccionado(almacen.id);
        onAlmacenChange(almacen);
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
                <select id="almacen" className='border border-gray-300 p-2 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500' onChange={handleAlmacenChange}>
                    <option value="">Seleccione un almacén...</option>
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
              className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10 p-2.5'
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
          <ButtonNormal color={'#01BDD6'} >
            <LuFilter className='icon-white w-4 h-4 ' />
          </ButtonNormal>
          <div className='flex items-center gap-2'>
            <select className='b text-center custom-select border border-gray-300 rounded-lg p-2.5 text-gray-900 text-sm rounded-lg' name="select" onChange={handleSelectChange}>
              <option value="">Seleccione...</option>
              <option value="imprimir">Imprimir</option>
              <option value="excel">Excel</option>
              <option value="excel-detalle">Excel Detalle</option>
            </select>
          </div>
          <Link to="/almacen/nota_ingreso/registro_ingreso">
            <ButtonIcon color={'#4069E4'} icon={<FaPlus style={{ fontSize: '25px' }} />}>
              Nota de ingreso
            </ButtonIcon>
          </Link>
        </div>

        </div>
    );
};

export default FiltrosIngresos;
