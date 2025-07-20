import { useState } from 'react';
import { MdAddCircleOutline } from 'react-icons/md';
import { Pagination, Tooltip, ScrollShadow, Select, SelectItem } from "@heroui/react";
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

  const navigate = useNavigate();
  const { hasCreatePermission } = usePermisos();

  const handleFiltersChange = (newFilters) => {
    setFilters((prevFilters) => {
      if (JSON.stringify(prevFilters) !== JSON.stringify(newFilters)) {
        return newFilters;
      }
      return prevFilters;
    });
  };

  return (
    <div className="m-4">
      <h1 className="font-extrabold text-4xl text-blue-900 tracking-tight mb-1">Guías de Remisión</h1>
      <p className="text-base text-blue-700/80 mb-4">Administra y busca guías de remisión fácilmente.</p>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
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
            endContent={<MdAddCircleOutline style={{ fontSize: '22px' }} />}
            onClick={() => hasCreatePermission ? navigate('/almacen/guia_remision/registro_guia') : null}
            disabled={!hasCreatePermission}
            className={`h-10 px-5 font-semibold rounded-lg shadow-sm bg-blue-600 hover:bg-blue-700 text-white transition ${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Nueva guía
          </Button>
        </Tooltip>
      </div>
      <div className="bg-white/90 border border-blue-100 rounded-2xl shadow-sm p-0">
        <ScrollShadow hideScrollBar className="rounded-2xl">
          <TablaGuias guias={guias} handleEditGuia={() => {}} />
        </ScrollShadow>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4 px-4 pb-2">
        <Pagination
          showControls
          page={currentPage}
          total={totalPages}
          onChange={setCurrentPage}
          color="primary"
          size="sm"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Filas por página:</span>
          <Select
            size="sm"
            className="w-32"
            selectedKeys={[`${guiasPerPage}`]}
            onChange={e => {
              setGuiasPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            aria-label="Filas por página"
            classNames={{
              trigger: "bg-slate-50 border-slate-200 text-blue-900",
              popoverContent: "bg-white"
            }}
          >
            <SelectItem key="5" value="5">05</SelectItem>
            <SelectItem key="10" value="10">10</SelectItem>
            <SelectItem key="20" value="20">20</SelectItem>
            <SelectItem key="100000" value="100000">Todo</SelectItem>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default Guias;