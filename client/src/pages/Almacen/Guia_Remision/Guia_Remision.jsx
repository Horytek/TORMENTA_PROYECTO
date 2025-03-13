import { useState } from 'react';
import './Guia_Remision.css';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { MdAddCircleOutline } from 'react-icons/md';
import { Pagination } from "@nextui-org/react";
import TablaGuias from './ComponentsGuias/GuiasTable';
import FiltrosGuias from './ComponentsGuias/FiltrosGuias';
import { Link } from 'react-router-dom';
import useGuiasData from '../data/data_guia';


const Guias = () => {
  const [filters, setFilters] = useState({});
  const { guias, removeGuia, currentPage, setCurrentPage, totalPages, guiasPerPage, setGuiasPerPage } = useGuiasData(filters);


  const [selectedRowId, setSelectedRowId] = useState(null);



  const onPageChange = (page) => {
    setCurrentPage(page);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters((prevFilters) => {
      if (JSON.stringify(prevFilters) !== JSON.stringify(newFilters)) {
        return newFilters;
      }
      return prevFilters;
    });
  };

  return (
    <div>
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Almacen', href: '/almacen' }, { name: 'Guias de Remision', href: '/almacen/guia_remision' }]} />
      <hr className="mb-4" />
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
          Guias de Remision
        </h1>
      
      </div>
      <br />
      <div className="flex justify-between items-center mb-4">
        <FiltrosGuias onFiltersChange={handleFiltersChange} />
        <Link to="/almacen/guia_remision/registro_guia" className="btn btn-nueva-guia">
          <MdAddCircleOutline className="inline-block mr-2" style={{ fontSize: '25px' }} />
          Nueva guia
        </Link>
      </div>

      <TablaGuias
        guias={guias}

        handleEditGuia={() => { }}
      />

      <div className="flex justify-between mt-4">
        <Pagination  showControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        <select className="border border-gray-300 bg-gray-50 rounded-lg w-20 text-center" value={guiasPerPage} onChange={(e) => setGuiasPerPage(parseInt(e.target.value))}>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
      </div>


    </div>
  );
};

export default Guias;
