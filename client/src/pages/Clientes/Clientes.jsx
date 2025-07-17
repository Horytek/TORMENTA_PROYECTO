import { useState, useRef } from 'react';
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import { Button } from "@nextui-org/button";
import TablaCliente from '@/pages/Clientes/ComponentsClientes/TablaCliente';
import useGetClientes from "@/services/client_data/getClientes";
import AddClientModal from './ComponentsClientes/AddClient';
import { usePermisos } from '@/routes';
import BarraSearch from "@/components/Search/Search";

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
    <div className="min-h-[80vh] bg-gradient-to-b from-white via-blue-50/60 to-blue-100/60 rounded-2xl shadow border border-blue-100 px-8 py-10 max-w-8xl mx-auto">
      <Toaster />
      <h1 className="text-4xl font-extrabold text-blue-900 mb-2">Gestión de clientes</h1>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-5 mb-8">
        <h6 className="font-bold text-blue-700">Lista de Clientes</h6>
        <BarraSearch
          placeholder="Ingrese nombres o razón social del cliente"
          isClearable={true}
          className="h-10 text-sm w-full md:w-2/4 bg-white border border-blue-100 rounded-lg shadow-sm"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <div className="flex gap-5">
          <Button
            color="primary"
            endContent={<FaPlus style={{ fontSize: '25px' }} />}
            onClick={handleModalAdd}
            disabled={!hasCreatePermission}
            className={`h-10 px-5 font-semibold rounded-lg shadow-sm bg-blue-600 hover:bg-blue-700 text-white transition ${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Agregar cliente
          </Button>
        </div>
      </div>
      <div className="bg-white/90 border border-blue-100 rounded-2xl shadow-sm p-8">
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
        setAllClientes={setAllClientes} // <-- Agrega esta línea
      />
      </div>
<AddClientModal
        open={activeAdd}
        onClose={handleModalAdd}
        refetch={() => refetch(page, limit, docType, docNumber, searchTerm)}
        setAllClientes={setAllClientes} // <-- Agrega esta línea
      />
    </div>
  );
}

export default Clientes;