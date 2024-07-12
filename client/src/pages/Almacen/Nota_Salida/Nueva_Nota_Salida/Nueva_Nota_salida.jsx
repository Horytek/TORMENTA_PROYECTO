import React from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
// import productosData from './data/productosData';
import Table from '@/components/Table/Table'; 
function NotaSalida() {
  const columns = [
    { header: 'Código', key: 'codigo' },
    { header: 'Descripción', key: 'descripcion' },
    { header: 'Marca', key: 'marca' },
    { header: 'Stock Actual', key: 'stockActual' },
    { header: 'Cantidad', key: 'cantidad' },
    { header: 'Acción', key: 'accion' }
  ];
    // Función para renderizar las acciones de la tabla
    const renderActions = (row) => (
      <div className="flex space-x-2">
        <button className="px-2 py-1 text-yellow-400 text-xl" onClick={() => handleEdit(row)}>
          <MdEdit />
        </button>
        <button className="px-2 py-1 text-red-500" onClick={() => handleDelete(row)}>
          <FaTrash />
        </button>
      </div>
    );
    // Función para manejar la acción de editar
    const handleEdit = (row) => {
      console.log('Edit', row);
    };
  
    // Función para manejar la acción de eliminar
    const handleDelete = (row) => {
      console.log('Delete', row);
    };
  return (
    <div>
      <Breadcrumb paths={[
        { name: 'Inicio', href: '/inicio' },
        { name: 'Almacén', href: '/almacen' },
        { name: 'Nota de salida', href: '/almacen/nota_salida' }
        ,{ name: 'Nueva Nota de salida', href: '/almacen/nota_salida/nueva_nota_salida' }
      ]} />
      <hr className="mb-4" />
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
          Nota de salida
        </h1>
      </div>
      <div className="container-registro-detalle-venta" style={{ backgroundColor: 'lightgray', padding: 20 }}>
      <form className="flex rounded-lg" >
        <div className="flex flex-col w-1/2">
          <div className="grid grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="destinatario">
                Destinatario:
              </label>
              <input className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10 p-2.5' id="destinatario" type="text" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ruc">
                RUC:
              </label>
              <input className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10 p-2.5' id="ruc" type="text" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="numero">
                Número:
              </label>
              <input className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10 p-2.5' id="numero" type="text" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fechaDocu">
                Fecha Docu:
              </label>
              <input type="date" className="border border-gray-300 rounded-lg p-2.5" id="fechaDocu" />
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
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="glosa">
              Glosa:
            </label>
            <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="glosa" type="text" />
          </div>
          <div className="flex-1">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="observacion">
              Observación:
            </label>
            <textarea className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-full" id="observacion"></textarea>
          </div>
        </div>
      </form>
      <div>
        <br />
        Aqui va la tabla
      </div>
      </div>
    </div>
  );
}

export default NotaSalida;
