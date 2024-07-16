import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { IoIosSearch } from "react-icons/io";
import { LuFilter } from "react-icons/lu";
import TablaIngresos from './ComponentsNotaIngreso/NotaIngresoTable';
import { Link } from 'react-router-dom';
import useIngresosData from './data/Nota_Ingreso_Data';
import { ButtonNormal, ButtonIcon } from '@/components/Buttons/Buttons';
import { FaPlus } from "react-icons/fa";
import './Nota_ingreso.css';

const Ingresos = () => {
  // Estado para manejar la lista de ingresos
  const { ingresos } = useIngresosData();





  return (
    <div>
      {/* Componente de migas de pan */}
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Almacén', href: '/almacen' }, { name: 'Nota de ingreso', href: '/almacen/nota_ingreso' }]} />
      <hr className="mb-4" />
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
          Nota de ingreso
        </h1>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 mt-5 mb-4">
        <div className="flex items-center gap-2">
          <h6 className='font-bold'>Almacén:</h6>
          <label className='border border-gray-300 p-2' htmlFor="">ALM CENTRAL ESCALERA</label>
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
          <input type="date" className="border border-gray-300 rounded-lg p-2.5" />
          <input type="date" className="border border-gray-300 rounded-lg p-2.5" />
        </div>
        <div className="flex items-center gap-2">
          <ButtonNormal color={'#01BDD6'}>
            <LuFilter className='icon-white w-4 h-4 ' />
          </ButtonNormal>
          <div className='flex items-center gap-2'>
            <select className='b text-center custom-select border border-gray-300 rounded-lg p-2.5 text-gray-900 text-sm rounded-lg' name="select">
              <option value="" selected>Seleccione...</option>
              <option value="value1">Imprimir</option>
              <option value="value2">Excel</option>
              <option value="value3">Excel Detalle</option>
            </select>
          </div>
          <br />
          <br />
          <Link to="/almacen/nota_ingreso/registro_ingreso">
            <ButtonIcon color={'#4069E4'} icon={<FaPlus style={{ fontSize: '25px' }} />}>
              Nota de ingreso
            </ButtonIcon>
          </Link>
        </div>
      </div>
      {/* Componente de tabla de ingresos */}
      <TablaIngresos
        ingresos={ingresos}
      />
    </div>
  );
};

export default Ingresos;
