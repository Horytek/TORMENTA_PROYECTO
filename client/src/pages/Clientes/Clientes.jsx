import { useState } from 'react';
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import { Button } from "@heroui/button";
import TablaCliente from '@/pages/Clientes/ComponentsClientes/TablaCliente';
import useGetClientes from "@/services/client_data/getClientes";
import AddClientModal from './ComponentsClientes/AddClient';
import { usePermisos } from '@/routes';
import BarraSearch from "@/components/Search/Search";
import { ActionButton } from "@/components/Buttons/Buttons";


function Clientes() {
  const { hasCreatePermission } = usePermisos();

  // Estado de Modal de Agregar Cliente
  const [activeAdd, setModalOpen] = useState(false);
  const handleModalAdd = () => setModalOpen(!activeAdd);

  // Filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");

  // Hook que solo consulta la BD una vez, el resto es local
  const { clientes, metadata, loading, error, refetch, setAllClientes } = useGetClientes();

  // Filtro y paginación local
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setPage(1);
    refetch(1, limit, docType, docNumber, value);
  };

  const handleFilterChange = (filterData) => {
    const { docType: newDocType, docNumber: newDocNumber } = filterData;
    setDocType(newDocType);
    setDocNumber(newDocNumber);
    setPage(1);
    refetch(1, limit, newDocType, newDocNumber, searchTerm);
  };

  const changePage = (newPage) => {
    setPage(newPage);
    refetch(newPage, limit, docType, docNumber, searchTerm);
  };

  const changeLimit = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
    refetch(1, newLimit, docType, docNumber, searchTerm);
  };

return (
  <>
    <Toaster />
    <div className="mx-2 md:mx-6 my-4">
      <h1 className="text-4xl font-extrabold text-blue-900 mb-4">Gestión de clientes</h1>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-5 mb-8">
        <h6 className="font-bold text-blue-700">Lista de Clientes</h6>
        <BarraSearch
          placeholder="Ingrese nombres o razón social del cliente"
          isClearable={true}
          className="h-10 text-sm w-full md:w-2/4"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <ActionButton
          color="blue"
          icon={<FaPlus className="w-4 h-4 text-blue-500" />}
          onClick={handleModalAdd}
          disabled={!hasCreatePermission}
          size="sm"
          className={`h-10 px-4 font-semibold rounded-lg border-0 shadow-none bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-200 ${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{ boxShadow: "none", border: "none" }}
        >
          Agregar cliente
        </ActionButton>
      </div>
      <div className="my-4">
        <TablaCliente
          clientes={clientes}
          totales={null}
          loading={loading}
          error={error}
          docType={docType}
          metadata={metadata}
          page={page}
          limit={limit}
          changePage={changePage}
          changeLimit={changeLimit}
          onDelete={() => refetch(page, limit, docType, docNumber, searchTerm)}
          onEdit={() => refetch(page, limit, docType, docNumber, searchTerm)}
          onFilter={handleFilterChange}
          setAllClientes={setAllClientes}
        />
      </div>
      <AddClientModal
        open={activeAdd}
        onClose={handleModalAdd}
        refetch={() => refetch(page, limit, docType, docNumber, searchTerm)}
        setAllClientes={setAllClientes}
      />
    </div>
  </>
);
}

export default Clientes;