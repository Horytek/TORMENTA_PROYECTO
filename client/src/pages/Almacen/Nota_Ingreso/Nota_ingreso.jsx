import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { IoIosSearch } from "react-icons/io";
import { LuFilter } from "react-icons/lu";
import TablaIngresos from './ComponentsNotaIngreso/NotaIngresoTable';
import { Link } from 'react-router-dom';
import useIngresosData from './data/Nota_Ingreso_Data';
import { ButtonSave, ButtonClose, ButtonNormal, ButtonIcon } from '@/components/Buttons/Buttons';
import { FaPlus, FaTrash } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import './Nota_ingreso.css';



const Ingresos = () => {
  // Estado para manejar la lista de ingresos
  const { ingresos, removeIngreso  } = useIngresosData();

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

  // Función para alternar la opción de eliminar guia
  const toggleDeleteDetalleOption = () => {
    setDeleteOptionSelected(!deleteOptionSelected);
  };

  // Función para eliminar una guia
  const handleDeleteGuia = () => {
    removeIngreso(selectedRowId);
    closeModal();
    setConfirmDeleteModalOpen(false);
  };

  // Función para cambiar de página en la paginación
  const onPageChange = (page) => {
    setCurrentPage(page);
  };

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

        {/* <DropdownButton id="dropdown-basic-button" title="Opciones">
          <Dropdown.Item href="#/action-1">Imprimir</Dropdown.Item>
          <Dropdown.Item href="#/action-2">Excel</Dropdown.Item>
        </DropdownButton> */}
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
        modalOpen={modalOpen}
        deleteOptionSelected={deleteOptionSelected}
        openModal={openModal}
        /* currentPage={currentPage} */
      />



    </div>
  );
};

export default Ingresos;