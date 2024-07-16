import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { IoIosSearch } from "react-icons/io";
import { LuFilter } from "react-icons/lu";
import TablaSalida from './ComponentsNotaSalida/NotaSalidaTable';
import { Link } from 'react-router-dom';
import useNotaSalidaData from './data/Nota_Salida_Data';
import { ButtonSave, ButtonClose, ButtonNormal, ButtonIcon } from '@/components/Buttons/Buttons';
import { FaPlus, FaTrash } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import ConfirmationModal from './ComponentsNotaSalida/Modals/ConfirmationModal';
import './Nota_salida.css';

const Salidas = () => {
  const { salidas, removeSalida } = useNotaSalidaData();

  const [selectedRowId, setSelectedRowId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOptionSelected, setDeleteOptionSelected] = useState(false);
  const [isConfirmationModalOpenImprimir, setIsConfirmationModalOpen] = useState(false);
  const [isModalOpenImprimir, setIsModalOpenImprimir] = useState(false);
  const [isModalOpenExcel, setIsModalOpenExcel] = useState(false);
  const [isModalOpenExcelDetalle, setIsModalOpenExcelDetalle] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5;

  const openModal = (id) => {
    setSelectedRowId(id);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedRowId(null);
    setModalOpen(false);
    setDeleteOptionSelected(false);
  };

  const openModalImprimir = () => {
    setIsModalOpenImprimir(true);
  };

  const closeModalImprimir = () => {
    setIsModalOpenImprimir(false);
  };

  const openModalExcel = () => {
    setIsModalOpenExcel(true);
  };

  const closeModalExcel = () => {
    setIsModalOpenExcel(false);
  };

  const openModalExcelDetalle = () => {
    setIsModalOpenExcelDetalle(true);
  };

  const closeModalExcelDetalle = () => {
    setIsModalOpenExcelDetalle(false);
  };

  const handleConfirmImprimir = () => {
    console.log('Nota de salida impresa.');
    setIsModalOpenImprimir(false);
  };

  const handleConfirmExcel = () => {
    console.log('Exportar a Excel.');
    setIsModalOpenExcel(false);
  };

  const handleConfirmExcelDetalle = () => {
    console.log('Exportar a Excel Detalle.');
    setIsModalOpenExcelDetalle(false);
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
    <div>
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Almacén', href: '/almacen' }, { name: 'Nota de salida', href: '/almacen/nota_salida' }]} />
      <hr className="mb-4" />
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
          Nota de salida
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
          <Link to="/almacen/nota_salida/nueva_nota_salida">
            <ButtonIcon color={'#4069E4'} icon={<FaPlus style={{ fontSize: '25px' }} />}>
              Nota de salida
            </ButtonIcon>
          </Link>
        </div>
      </div>

      <TablaSalida
        salidas={salidas}
        modalOpen={modalOpen}
        deleteOptionSelected={deleteOptionSelected}
        openModal={openModal}
      />
      {isModalOpenImprimir && (
        <ConfirmationModal 
          message='¿Desea imprimir la nota de salida?' 
          onClose={closeModalImprimir} 
          isOpen={isModalOpenImprimir}
          onConfirm={handleConfirmImprimir}
        />
      )}
      {isModalOpenExcel && (
        <ConfirmationModal 
          message='¿Desea exportar a Excel?' 
          onClose={closeModalExcel} 
          isOpen={isModalOpenExcel}
          onConfirm={handleConfirmExcel}
        />
      )}
      {isModalOpenExcelDetalle && (
        <ConfirmationModal 
          message='¿Desea exportar a Excel Detalle?' 
          onClose={closeModalExcelDetalle} 
          isOpen={isModalOpenExcelDetalle}
          onConfirm={handleConfirmExcelDetalle}
        />
      )}
    </div>
  );
};

export default Salidas;
