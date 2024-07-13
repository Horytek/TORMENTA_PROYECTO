import React from 'react';
import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { MdPersonAdd } from "react-icons/md";
import { Link } from 'react-router-dom';
import { FiSave } from "react-icons/fi";
import { FaBarcode } from "react-icons/fa6";
import { IoIosSearch } from "react-icons/io";
import { LuFilter } from "react-icons/lu";
import { FaPlus, FaTrash } from "react-icons/fa";
import useNuevaNotaSalidaData from './data/Nueva_Nota_Salida_Data';
import { ButtonSave, ButtonClose, ButtonNormal, ButtonIcon } from '@/components/Buttons/Buttons';
import NuevaTablaSalida from './ComponentsNuevaNotaSalida/NuevaNotaSalidaTable';
import './Nueva_Nota_salida.css';

const NuevaSalidas = () => {
  // Estado para manejar la lista de ingresos
  const { salidas, removeSalida  } = useNuevaNotaSalidaData();

  // Estado para el manejo del modal y opciones de eliminación
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
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

  return (
    <div>
      <Breadcrumb paths={[
        { name: 'Inicio', href: '/inicio' },
        { name: 'Almacén', href: '/almacen' },
        { name: 'Nota de salida', href: '/almacen/nota_salida' }
        , { name: 'Nueva Nota de salida', href: '/almacen/nota_salida/nueva_nota_salida' }
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
                <input className='border border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-24 p-2.5' id="destinatario" type="text" />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ruc">
                  RUC:
                </label>
                <input className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-24 p-2.5' id="ruc" type="text" />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="numero">
                  Número:
                </label>
                <input className='border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-24 p-2.5' id="numero" type="text" />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fechaDocu">
                  Fecha Docu:
                </label>
                <input type="date" className="border border-gray-300 rounded-lg p-2.5" id="fechaDocu" />
              </div>
            </div>
            <div className="flex justify-start mt-4 space-x-2">
              <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
                <MdPersonAdd className="inline-block mr-2 text-lg" /> Nuevo proveedor
              </button>
              <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
                <FaBarcode className="inline-block mr-2" /> Buscar producto
              </button>

              <Link to="/almacen/nota_salida">
                <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
                  Cancelar
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
    </div>
  );
};

export default NuevaSalidas;