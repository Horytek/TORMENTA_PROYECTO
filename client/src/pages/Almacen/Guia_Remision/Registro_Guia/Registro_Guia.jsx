import React, { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { IoMdPin, IoMdCar, IoMdAdd, IoIosSearch } from 'react-icons/io';
import { MdPersonAdd } from "react-icons/md";
import ModalBuscarProducto from '../../Nota_Ingreso/ComponentsNotaIngreso/Modals/BuscarProductoForm';
import { FiSave } from "react-icons/fi";
import { FaBarcode } from "react-icons/fa6";
import TablaRegGuia from "./ComponentsRegGuias/RegGuiaTable";
import UbigeoForm from './UbigeoForm';
import useClienteData from '../../data/data_cliente_guia';
import useSucursalData from '../../data/data_sucursal_guia';
import useDocumentoData from '../../data/generar_doc_guia';
import TransporteForm from './UndTrans';
import ClienteForm from './ClienteForm';
import ProductosForm from '@/pages/Productos/ProductosForm';


const glosaOptions = [
  "COMPRA", "VENTA CON ENTREGA A TERCEROS", "TRASLADO ENTRE ALMACENES DE LA MISMA CIA.",
  "CONSIGNACION", "DEVOLUCION", "RECOJO DE BIENES TRANSFORMADOS",
  "IMPORTACION", "EXPORTACION",
  "OTROS", "VENTA SUJETA A CONFIRMACION DEL COMPRADOR", "TRASLADO DE BIENES PARA TRANSFORMACION",
  "TRASLADO EMISOR ITINERANTE CP"
];


function RegistroGuia() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState('');
  const { clientes } = useClienteData();
  const { sucursales } = useSucursalData();
  const { documentos } = useDocumentoData();
  const [ubipart, setUbipart] = useState('');
  const [ubidest, setUbidest] = useState('');

  const handleSaveUbigeo = (selectedUbipart, selectedUbidest) => {
    setUbipart(selectedUbipart);
    setUbidest(selectedUbidest);
  };

  const openModal = (title, type) => {
    setModalTitle(title);
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalTitle('');
    setModalType('');
  };

  const currentDocumento = documentos.length > 0 ? documentos[0].guia : '';


  return (
    <div>
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' },
      { name: 'Almacén', href: '/almacen' },
      { name: 'Guias de Remision', href: '/almacen/guia_remision' },
      { name: 'Registrar Guía de Remisión', href: '/almacen/guia_remision/registro_guia' }]} />
      <hr className="mb-4" />
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
          Nueva Guía de Remisión
        </h1>
      </div>
      <div className="rounded" style={{ backgroundColor: '#F2F3F4' }}>

        <div className="flex rounded" style={{ backgroundColor: '#F2F3F4', padding: 10 }}>
          <div className="flex flex-col w-1/2">
            <div className="grid grid-cols-2 gap-4">
              <div className="">
                <div className='w-full relative group text-start'>
                  <label htmlFor="numguia" className='text-sm font-bold text-black'>Número de guía:</label>
                  <input id="numero"
                    type="text"
                    value={currentDocumento}
                    className='w-full bg-gray-200 border-gray-300 text-black rounded-lg border p-1 ' disabled />
                </div>
              </div>
              <div className="">
                <div className='w-full relative group text-start'>
                  <label htmlFor="dirdest" className='text-sm font-bold text-black'>Fecha:</label>
                  <input type="date" name='date' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' defaultValue={new Date().toISOString().slice(0, 10)} />
                </div>
              </div>

              <div className="">
                <label htmlFor="cliente" className='text-sm font-bold text-black' >Cliente:</label>
                <select id='cliente' className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2' onChange={(e) => {
                  const selected = clientes.find(d => d.id === parseInt(e.target.value));
                  document.getElementById('documento').value = selected ? selected.documento : '';
                }}>
                  <option>Seleccione...</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="">
                <div className='w-full relative group text-start'>
                  <label htmlFor="documento" className='text-sm font-bold text-black'>RUC/DNI:</label>
                  <input type="text"
                    name='documento'
                    id="documento"
                    className='w-full bg-gray-200 border-gray-300 text-gray-900 rounded-lg border p-1' disabled />
                </div>
              </div>

              <div className='w-full relative group  text-start'>
                <label htmlFor="vendedor" className='text-sm font-bold text-black'>Vendedor:</label>
                <select id='vendedor' className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2' onChange={(e) => {
                  const selected = sucursales.find(s => s.id === parseInt(e.target.value));
                  document.getElementById('id').value = selected ? selected.id : '';
                }}>
                  <option>Seleccione...</option>
                  {sucursales.map((sucursal) => (
                    <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="flex">
                <div className="flex-1 mr-2">
                  <label htmlFor="cantidad" className="block text-gray-700 text-sm font-bold ">Cant. Paq:</label>
                  <input type="cant" name='cant' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' />
                </div>
                <div className="flex-1 ml-2">
                  <label htmlFor="peso" className="block text-gray-700 text-sm font-bold">Peso Kg:</label>
                  <input type="peso" name='peso' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' />
                </div>
              </div>
              <div className="">
                <label className="block text-gray-700 text-sm font-bold mt-5" htmlFor="direcdest">
                </label>
                <button className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-2 rounded"
                  type="button" onClick={() => openModal('Ubicación de Partida / Ubicación de Destino', 'ubicacion')}>
                  <IoMdPin className="inline-block mr-2" /> Ub. de Partida/Ub. de Destino
                </button>
              </div>
              <div className="">
                <label htmlFor="glosa" className='text-sm font-bold text-black'>Glosa.Sal:</label>
                <select id='glosa' className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                  <option>Seleccione...</option>
                  {glosaOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div className="">
                <div className='w-full relative group text-start'>
                  <label htmlFor="ubipart" className='text-sm font-bold text-black'>Ubi. Part:</label>
                  <input
                    type="text"
                    name='ubipart'
                    value={ubipart}
                    className='w-full bg-gray-200 border-gray-300 text-gray-900 rounded-lg border p-1'
                    disabled
                  />
                </div>
              </div>
              <div className="">
                <div className='w-full relative group text-start'>
                  <label htmlFor="dirpart" className='text-sm font-bold text-black'>Dir. Partida:</label>
                  <input type="dirpart" name='dirpart' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1' />
                </div>
              </div>
              <div className="">
                <div className='w-full relative group mb-5 text-start'>
                  <label htmlFor="ubidest" className='text-sm font-bold text-black'>Ubi. Dest:</label>
                  <input
                    type="text"
                    name='ubidest'
                    value={ubidest}
                    className='w-full bg-gray-200 border-gray-300 text-gray-900 rounded-lg border p-1'
                    disabled
                  />
                </div>
              </div>
              <div className="">
                <div className='w-full relative group text-start'>
                  <label htmlFor="dirdest" className='text-sm font-bold text-black'>Dir. Destino:</label>
                  <input type="dirdest" name='dirdest' className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1' />
                </div>
              </div>

              <div className="">
                <div className='w-full relative group text-start'>
                  <label htmlFor="trans" className='text-sm font-bold text-black'>Transporte:</label>
                  <input type="trans" name='trans' className='w-full bg-gray-200 border-gray-300 text-gray-900 rounded-lg border p-1' disabled />
                </div>
              </div>
              <div className="flex">
                <div className="flex-1 mr-2">
                  <label htmlFor="cantidad" className="block text-gray-700 text-sm font-bold  "></label>
                  <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
                    type="button" onClick={() => openModal('Datos del Transporte', 'transporte')}>
                    <IoMdCar className="inline-block mr-2 text-lg" /> Datos de Transporte
                  </button>
                </div>
                <div className="flex-1 ml-2">
                  <label htmlFor="peso" className="block text-gray-700 text-sm font-bold"></label>
                  <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                    type="button" onClick={() => openModal('Nuevo Cliente', 'cliente')}>
                    <MdPersonAdd className="inline-block mr-2 text-lg" />Nuevo Cliente
                  </button>
                </div>
              </div>
              <div className="">
                <div className='w-full relative group text-start'>

                </div>
              </div>
              <div className="">
                <div className='w-full relative group text-start'>
                  <label htmlFor="peso" className="block text-gray-700 text-sm font-bold mt-6"></label>
                  <button className="bg-yellow-500 hover:bg-yellow-600 text-black w-full font-bold py-1.5 px-4 rounded"
                    type="button" onClick={() => openModal('Buscar Producto', 'producto')}>
                    <FaBarcode className="inline-block mr-2" /> Buscar producto
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="ml-4 flex flex-col w-1/2">
            <div className="flex-1">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="observacion">
                Observación:
              </label>
              <textarea className="shadow appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight resize-none"
                id="observacion" style={{ height: "94%" }}></textarea>
            </div>
            <div className="mt-10 flex justify-end">
              <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-1.5 px-4 rounded" type="button">
                <FiSave className="inline-block mr-2 text-lg" /> Guardar
              </button>
            </div>
          </div>
        </div>

        <br />
        <TablaRegGuia />
      </div>
      {modalType === 'buscarProducto' && (
        <ModalBuscarProducto isOpen={isModalOpen} onClose={closeModal}>
          <div className="flex mb-4">
            <input
              type="text"
              placeholder="Buscar producto"
              className="border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 flex-grow"
            />
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2 flex items-center">
              <IoIosSearch className='w-4 h-4 mr-1' />
              Buscar
            </button>
            <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-2 flex items-center" onClick={() => openModal('Agregar Producto', 'producto')}>
              <IoMdAdd className='w-4 h-4 mr-1' />
              Nuevo
            </button>
          </div>
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Código</th>
                <th className="py-2 px-4 border-b">Descripción</th>
                <th className="py-2 px-4 border-b">Marca</th>
                <th className="py-2 px-4 border-b">Cantidad</th>
                <th className="py-2 px-4 border-b">Acción</th>
              </tr>
            </thead>
            <tbody>
              {/* Aquí puedes mapear tus datos de productos */}
              <tr>
                <td className="py-2 px-4 border-b text-center">001</td>
                <td className="py-2 px-4 border-b text-center">Producto A</td>
                <td className="py-2 px-4 border-b text-center">Marca A</td>
                <td className="py-2 px-4 border-b text-center">10</td>
                <td className="py-2 px-4 border-b text-center">
                  <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                    <IoMdAdd />
                  </button>
                </td>
              </tr>
              {/* Repite las filas según tus datos */}
            </tbody>
          </table>
        </ModalBuscarProducto>
      )}
      {/* Modals */}
      {isModalOpen && modalType !== 'buscarProducto' && (
        <>
          {modalType === 'ubicacion' && <UbigeoForm modalTitle={modalTitle} onClose={closeModal} onSave={handleSaveUbigeo} />}
          {modalType === 'transporte' && <TransporteForm modalTitle={modalTitle} onClose={closeModal} />}
          {modalType === 'cliente' && <ClienteForm modalTitle={modalTitle} onClose={closeModal} />}
          {modalType === 'producto' && <ProductosForm modalTitle={modalTitle} onClose={closeModal} />}
        </>
      )}
    </div>
  );
}

export default RegistroGuia;
