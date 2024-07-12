import React from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';

function NotaSalida() {
  return (
    <div>
      <Breadcrumb paths={[
        { name: 'Inicio', href: '/inicio' },
        { name: 'Almacén', href: '/almacen' },
        { name: 'Nota de salida', href: '/almacen/nota_salida' }
      ]} />
      <hr className="mb-4" />
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
          Nota de salida
        </h1>
      </div>
      <form className="flex border rounded" style={{ backgroundColor: '#F2F3F4', padding: 10 }}>
  <div className="flex flex-col w-1/2">
    <div className="grid grid-cols-2 gap-4">
      <div className="mb-4">
        <div className='w-full relative group mb-5 text-start'>
          <label htmlFor="proveedor" className='text-sm font-bold text-black'>Proveedor:</label>
          <input type="text" name='proveedor' className='w-full bg-white-300 border-gray-300 text-gray-900 rounded-lg border p-1.5 ' />
        </div>
      </div>
      <div className="mb-4">
        <div className='w-full relative group mb-5 text-start'>
          <label htmlFor="ruc" className='text-sm font-bold text-black'>RUC:</label>
          <input type="text" name='ruc' className='w-full bg-white-300 border-gray-300 text-gray-900 rounded-lg border p-1.5 ' />
        </div>
      </div>
      <div className="mb-4">
        <div className='w-full relative group mb-5 text-start'>
          <label htmlFor="numero" className='text-sm font-bold text-black'>Número:</label>
          <input type="text" name='numero' className='w-full bg-white-300 border-gray-300 text-gray-900 rounded-lg border p-1.5 ' />
        </div>
      </div>
      <div className="mb-4">
        <div className='w-full relative group mb-5 text-start'>
          <label htmlFor="fechaDocu" className='text-sm font-bold text-black'>Fecha Docu:</label>
          <input type="date" name='fechaDocu' className='w-full bg-white-300 border-gray-300 text-gray-900 rounded-lg border p-1.5 ' />
        </div>
      </div>
    </div>
    <div className="flex justify-between mt-4 space-x-2">
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
        Nuevo proveedor
      </button>
      <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
        Buscar producto
      </button>
      <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
        Cancelar
      </button>
      <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
        Guardar
      </button>
    </div>
  </div>
  <div className="ml-4 flex flex-col w-1/2">
    <div className="mb-4">
      <div className='w-full relative group mb-5 text-start'>
        <label htmlFor="glosa" className='text-sm font-bold text-black'>Glosa:</label>
        <input type="text" name='glosa' className='w-full bg-white-300 border-gray-300 text-gray-900 rounded-lg border p-1.5 ' />
      </div>
    </div>
    <div className="flex-1">
      <label htmlFor="glosa" className='text-sm font-bold text-black'>Observación:</label>
      <textarea className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-full" id="observacion"></textarea>
    </div>
  </div>
</form>

    </div>
  );
}

export default NotaSalida;
