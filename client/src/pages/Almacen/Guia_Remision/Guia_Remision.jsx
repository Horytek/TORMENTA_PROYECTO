import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { MdAddCircleOutline } from 'react-icons/md';
import { Pagination, Tooltip } from "@heroui/react";
import TablaGuias from './ComponentsGuias/GuiasTable';
import FiltrosGuias from './ComponentsGuias/FiltrosGuias';
import { useNavigate } from "react-router-dom";
import useGuiasData from '../data/data_guia';
import { usePermisos } from '@/routes';
import { Button } from "@heroui/button";

const Guias = () => {
  const [filters, setFilters] = useState({});
  const {
    guias,
    removeGuia,
    currentPage,
    setCurrentPage,
    totalPages,
    guiasPerPage,
    setGuiasPerPage,
  } = useGuiasData(filters);

  const [selectedRowId, setSelectedRowId] = useState(null);

  const navigate = useNavigate();

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

  const { hasCreatePermission } = usePermisos();

  return (
    <div>
      <Breadcrumb
        paths={[
          { name: 'Inicio', href: '/inicio' },
          { name: 'Almacen', href: '/almacen' },
          { name: 'Guias de Remision', href: '/almacen/guia_remision' },
        ]}
      />
      <hr className="mb-4" />

      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-[36px] font-bold">Guias de Remision</h1>
      </div>

      <br />

      <div className="flex justify-between items-center mb-4">
        <FiltrosGuias onFiltersChange={handleFiltersChange} />
        <Tooltip
          content={
            hasCreatePermission
              ? 'Crear nueva guía de remisión'
              : 'No tiene permisos para crear guías'
          }
        >
          <Button
            color="primary"
            endContent={<MdAddCircleOutline style={{ fontSize: '25px' }} />}
            onClick={() => hasCreatePermission ? navigate('/almacen/guia_remision/registro_guia') : null}
            disabled={!hasCreatePermission}
            className={`${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Nueva guía
          </Button>
        </Tooltip>
      </div>

      <TablaGuias guias={guias} handleEditGuia={() => {}} />

      <div className="flex justify-between mt-4">
        <Pagination
          showControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
        <select
          className="border border-gray-300 bg-gray-50 rounded-lg w-20 text-center"
          value={guiasPerPage}
          onChange={(e) => setGuiasPerPage(parseInt(e.target.value))}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
      </div>
    </div>
  );
};

export default Guias;
