/*
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { useState } from 'react';
import { LuFilter } from "react-icons/lu";
import { ButtonNormal } from '@/components/Buttons/Buttons';
import TablaKardex from './ComponentsKardex/KardexTable';
import useKardexData from './data/kardexdata';
import Pagination from '@/components/Pagination/Pagination';
const Kardex = () => {
    const { ingresos } = useKardexData();
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 5; // Número total de páginas

      // Función para cambiar de página en la paginación
  const onPageChange = (page) => {
    setCurrentPage(page);
  };
    return (
        <div>
            {/* Componente de migas de pan */
/*}
            <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Almacén', href: '/almacen' }, { name: 'Kardex Movimientos', href: '/almacen/kardex' }]} />
            <hr className="mb-4" />
            <div className="flex justify-between mt-5 mb-4">
                <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
                    Kardex Movimientos
                </h1>
            </div>
            <div className="mt-5 mb-4 font-bold">
                <label htmlFor="">Kardex de Movimientos / Tienda: Almacén:</label>
                <select className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5'>
                    <option value="">ALMACEN BALTA 7-8</option>
                    {/* Add other options here */
/*}
               </select>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 mt-5 mb-4">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder='CÓDIGO'
                        className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5'
                    />
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder='DESCRIPCIÓN'
                        className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5'
                    />
                </div>
                <div className="flex items-center gap-2">
                    <select className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5'>
                        <option value="">LÍNEA</option>
                        {/* Add other options here */
/*}
                   </select>
                </div>
                <div className="flex items-center gap-2">
                    <select className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5'>
                        <option value="">SUB-LÍNEA</option>
                        {/* Add other options here */
/*}
                   </select>
                </div>
                <div className="flex items-center gap-2">
                    <select className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5'>
                        <option value="">CUALQUIER MARCA</option>
                        {/* Add other options here */
/*}
                   </select>
                </div>
                <div className="flex items-center gap-2">
                    <select className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5'>
                        <option value="">@Todos</option>
                        {/* Add other options here */
/*}                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <ButtonNormal color={'#01BDD6'}>
                        <LuFilter className='icon-white w-4 h-4 ' />
                    </ButtonNormal>
                </div>
                <div className='flex items-center gap-2'>
                    <select className='b text-center custom-select border border-gray-300 rounded-lg p-2.5 text-gray-900 text-sm rounded-lg' name="select" defaultValue="">
                        <option value="">Seleccione...</option>
                        <option value="value1">Imprimir</option>
                    </select>
                </div>
            </div>
            {/* Componente de tabla de ingresos */
/*}            <TablaKardex ingresos={ingresos} />

            <div className="flex justify-between mt-4">
        <div className="flex">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
        <select className="input-d cant-pag-d">
          <option>5</option>
          <option>10</option>
          <option>20</option>
        </select>
      </div>
        </div>
    );
}

export default Kardex;
*/