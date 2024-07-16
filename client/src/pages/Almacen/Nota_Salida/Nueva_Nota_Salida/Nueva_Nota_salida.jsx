import React from 'react';
import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import ModalBuscarProducto from '@/pages/Almacen/Nota_Ingreso/ComponentsNotaIngreso/Modals/BuscarProductoForm';  // Asegúrate de que la ruta del componente Modal sea correcta
import { MdPersonAdd } from "react-icons/md";
import { Link } from 'react-router-dom';
import { FiSave } from "react-icons/fi";
import { FaBarcode } from "react-icons/fa6";
import { IoMdAdd } from "react-icons/io";
import { IoIosSearch } from "react-icons/io";
import { MdCancelPresentation } from "react-icons/md";
import ProductosModal from '@/pages/Productos/ProductosForm';
import useNuevaNotaSalidaData from './data/Nueva_Nota_Salida_Data';
import AgregarProovedor from '../ComponentsNotaSalida/Modals/AgregarProovedor';
import NuevaTablaSalida from './ComponentsNuevaNotaSalida/NuevaNotaSalidaTable';
import './Nueva_Nota_salida.css';

const NuevaSalidas = () => {
  // Estado para manejar la lista de ingresos
  const { salidas, removeSalida } = useNuevaNotaSalidaData();

  // Estado para el manejo del modal y opciones de eliminación
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalOpenProovedor, setModalOpenProovedor] = useState(false);
  const [deleteOptionSelected, setDeleteOptionSelected] = useState(false);
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5; // Número total de páginas

  // Funciones para abrir y cerrar el modal de opciones
  const openModal = (id) => {
    setSelectedRowId(id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedRowId(null);
    setModalOpen(false);
    setDeleteOptionSelected(false);
  };
  const openModalBuscarProducto = () => setIsModalOpen(true);
  const closeModalBuscarProducto = () => setIsModalOpen(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenProducto, setIsModalOpenProducto] = useState(false);
  const [isModalOpenProovedor, setIsModalOpenProovedor] = useState(false);
  const [isModalOpenImprimir, setIsModalOpenImprimir] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  // Funcion para manejar la accion de iniciar el modal de agregar/editar producto
  const openModalProducto = (title) => {
    setModalTitle(title);
    setIsModalOpenProducto(true);
  };

  // Funcion para manejar la accion de cerrar el modal de agregar/editar producto
  const closeModalProducto = () => {
    setIsModalOpenProducto(false);
  };

  const openModalProovedor = () => {
    setIsModalOpenProovedor(true);
    
  };

  const closeModalProovedor = () => {
    setIsModalOpenProovedor(false);
  };


  return (
    <div>
      <Breadcrumb paths={[
        { name: 'Inicio', href: '/inicio' },
        { name: 'Almacén', href: '/almacen' },
        { name: 'Nota de salida', href: '/almacen/nota_salida' }
        , { name: 'Nueva nota de salida', href: '/almacen/nota_salida/nueva_nota_salida' }
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
                <input className='border border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10 p-2.5' id="destinatario" type="text" />
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
            <div className="flex justify-start mt-4 space-x-2">
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button" onClick={openModalProovedor} >
                <MdPersonAdd className="inline-block mr-2 text-lg" /> Nuevo proveedor
              </button>
              <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button" onClick={openModalBuscarProducto} >
                <FaBarcode className="inline-block mr-2" /> Buscar producto
              </button>

              <Link to="/almacen/nota_salida">
              <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
                <MdCancelPresentation className="inline-block mr-2"  /> Cancelar
                </button>
              </Link>


              <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
                <FiSave className="inline-block mr-2 text-lg" /> Guardar
              </button>
            </div>
          </div>
          <div className="ml-4 flex flex-col w-1/2">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="glosa">
                Glosa:
              </label>
              <input className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-24 p-2.5 w-full" id="glosa" type="text" />
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="observacion">
                Observación:
              </label>
              <textarea className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-24 p-2.5 w-full h-full" id="observacion"></textarea>
            </div>
          </div>
        </form>
        <div>
          <br />
          <br />
          {/* Componente de tabla de ingresos */}
          <NuevaTablaSalida
            salidas={salidas}
            modalOpen={modalOpen}
            deleteOptionSelected={deleteOptionSelected}
            openModal={openModal}
          /* currentPage={currentPage} */
          />
        </div>
      </div>
      <ModalBuscarProducto isOpen={isModalOpen} onClose={closeModalBuscarProducto}>
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
          <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-2 flex items-center" onClick={() => openModalProducto('Agregar Producto')}>
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
      {/* Modal de Agregar Producto */}
      {isModalOpenProducto && (
        <ProductosModal modalTitle={modalTitle} onClose={closeModalProducto} />
      )}
      <AgregarProovedor isOpen={isModalOpenProovedor} onClose={closeModalProovedor} />


    </div>
  );
};

export default NuevaSalidas;