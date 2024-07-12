import React from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import {IoMdPin } from 'react-icons/io';
function RegistroGuia() {

  return (
    <div>
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, 
                          { name: 'Almacén', href: '/almacen' },
                          { name: 'Guias de Remision', href: '/guiasremision' },
                          { name: 'Registrar Guía de Remisión', href: '/almacen/guia_remision/registro_guia' }]} />
      <hr className="mb-4" />
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
          Nueva Guía de Remisión
        </h1>
      </div>
      <div className="rounded" style={{ backgroundColor: '#F2F3F4' }}>
      <form className="flex rounded" style={{ backgroundColor: '#F2F3F4', padding: 10 }}>
        <div className="flex flex-col w-1/2">
          <div className="grid grid-cols-2 gap-4">
          <div className='w-full relative group mb-5 text-start'>
                <label htmlFor="documento" className='text-sm font-bold text-black'>Documento:</label>
                <select id='documento' className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                  <option>Guia de Remision</option>
                  <option>Seleccione...</option>
                </select>
          </div>
            <div className="mb-4">
            <label htmlFor="glosa" className='text-sm font-bold text-black'>Glosa.Sal:</label>
                <select id='glosa' className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                  <option>Seleccione...</option>
                </select>
            </div>
            <div className="mb-4">
            <div className='w-full relative group mb-5 text-start'>
                <label htmlFor="cliente" className='text-sm font-bold text-black'>Cliente:</label>
                <input type="cliente" name='cliente' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' />
              </div>
            </div>
            <div className="mb-4">
            <div className='w-full relative group mb-5 text-start'>
                <label htmlFor="dirpart" className='text-sm font-bold text-black'>Dir. Partida:</label>
                <input type="dirpart" name='cliente' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' />
              </div>
            </div>
            <div className="mb-4">
            <label htmlFor="vendedor" className='text-sm font-bold text-black'>Vendedor:</label>
                <select id='vendedor' className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                  <option>Seleccione...</option>
                  <option>CENTRAL 22</option>
                  <option>CENTRAL 52 - 53</option>
                  <option>CENTRAL ESCALERA</option>
                  <option>OFICINA</option>
                  <option>TIENDA BALTA</option>
                </select>
            </div>
            <div className="mb-4">
            <div className='w-full relative group mb-5 text-start'>
                <label htmlFor="dirdest" className='text-sm font-bold text-black'>Dir. Destino:</label>
                <input type="dirdest" name='cliente' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' />
              </div>
            </div>
            <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mt-5" htmlFor="direcdest">     
            </label>     
            <button className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-2 rounded focus:outline-none focus:shadow-outline" type="button">
                <IoMdPin className="inline-block mr-2" /> Ub. de Partida/Ub. de Destino
            </button>
            </div>
            <div className="mb-4">
            <div className='w-full relative group mb-5 text-start'>
                <label htmlFor="dirdest" className='text-sm font-bold text-black'>Fecha:</label>
                <input type="date" name='cliente' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' />
              </div>
            </div>
            <div className="mb-4">
            <div className='w-full relative group mb-5 text-start'>
                <label htmlFor="ubipart" className='text-sm font-bold text-black'>Ubi. Part:</label>
                <input type="ubipart" name='cliente' className='w-full bg-gray-300 border-gray-300 text-gray-900 rounded-lg border p-1.5 ' disabled/>
              </div>
            </div>
            <div className="mb-4">
            <label htmlFor="referencia" className='text-sm font-bold text-black'>Referencia:</label>
                <select id='referencia' className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                  <option>Seleccione...</option>
                  <option>NINGUNA</option>
                  <option>FACTURA</option>
                  <option>BOLETA</option>
                  <option>COTIZACION</option>
                  <option>NOTA PEDIDO</option>
                </select>
            </div>
            <div className="mb-4">
            <div className='w-full relative group mb-5 text-start'>
                <label htmlFor="ubidest" className='text-sm font-bold text-black'>Ubi. Dest:</label>
                <input type="ubidest" name='cliente' className='w-full bg-gray-300 border-gray-300 text-gray-900 rounded-lg border p-1.5 ' disabled/>
              </div>
            </div>
            <div className="mb-4 flex">
                    <div className="flex-1 mr-2">
                <label for="cantidad" className="block text-gray-700 text-sm font-bold mb-2">Cant. Paq:</label>
                 <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="cantidad" type="text" />
                </div>
                <div className="flex-1 ml-2">
                    <label label for="peso" className="block text-gray-700 text-sm font-bold mb-2">Peso Kg:</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="peso" type="text" />
                </div>
            </div>
            <div className="mb-4">
            <div className='w-full relative group mb-5 text-start'>
                <label htmlFor="numdoc" className='text-sm font-bold text-black'>Num. Doc:</label>
                <input type="numdoc" name='cliente' className='w-full bg-gray-300 border-gray-300 text-gray-900 rounded-lg border p-1.5 ' disabled/>
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

export default RegistroGuia;
