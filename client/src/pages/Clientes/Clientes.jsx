import { useState, useRef } from 'react';
// import ClientesForm from './ClientesForm';
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import { Button } from "@nextui-org/button";
import TablaCliente from '@/pages/Clientes/ComponentsClientes/TablaCliente';
import useGetClientes from './data/getClientes';
import AddClientModal from './ComponentsClientes/AddClient';
import { usePermisos } from '@/routes';
import BarraSearch from "@/components/Search/Search";

function Clientes() {

  const { hasCreatePermission } = usePermisos();

  // Estado de Modal de Agregar Cliente
  const [activeAdd, setModalOpen] = useState(false);
  const handleModalAdd = () => {
    setModalOpen(!activeAdd);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const searchTimeoutRef = useRef(null);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      refetch(1, limit, docType, docNumber, value);
    }, 500);
  };

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [docType, setDocType] = useState("");
  const [docNumber, setDocNumber] = useState("");

  const { clientes, metadata, loading, error, refetch } = useGetClientes(
    page,
    limit,
    docType,
    docNumber
  );

  const handleFilterChange = (filterData) => {
    const { docType: newDocType, docNumber: newDocNumber } = filterData;
    setDocType(newDocType);
    setDocNumber(newDocNumber);
    setPage(1); // Reset to first page when filtering
    refetch(1, limit, newDocType, newDocNumber);
  };

  const changePage = (newPage) => {
    setPage(newPage);
    refetch(newPage, limit, docType, docNumber);
  };

  const changeLimit = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
    refetch(1, newLimit, docType, docNumber);
  };

  return (
    <div>
      <Toaster />
     
      <h1 className="text-4xl font-extrabold">Gestión de clientes</h1>
      <div className="flex items-center justify-between mt-5 mb-4">
        <div id="barcode-scanner" hidden style={{ width: '100%', height: '400px' }}></div>
        <h6 className="font-bold">Lista de Clientes</h6>
        <BarraSearch
          placeholder="Ingrese nombres o razón social del cliente"
          isClearable={true}
          className="h-9 text-sm w-1/2"
         
        />
        <div className="flex gap-5">
          <Button
            color="primary"
            endContent={<FaPlus style={{ fontSize: '25px' }} />}
            onClick={handleModalAdd}
            disabled={!hasCreatePermission}
            style={
              !hasCreatePermission
                ? { opacity: 0.5, cursor: 'not-allowed' }
                : { boxShadow: 'inset 0 1px 0 hsl(224, 84%, 74%), 0 1px 3px hsl(0, 0%, 0%, 0.2)' }
            }
          >
            Agregar cliente
          </Button>
        </div>
      </div>
      <div>
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
          onDelete={() => refetch(page, limit, docType, docNumber)}
          onEdit={() => refetch(page, limit, docType, docNumber)}
          onFilter={handleFilterChange}


        />
      </div>

      <AddClientModal
        open={activeAdd}
        onClose={handleModalAdd}
        refetch={() => refetch(page, limit, docType, docNumber)}
      />
    </div>
  );
}

export default Clientes;