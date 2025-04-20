import { useState, useRef } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
// import ClientesForm from './ClientesForm';
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
import { Button } from "@nextui-org/button";
import TablaCliente from '@/pages/Clientes/ComponentsClientes/TablaCliente';
import useGetClientes from './data/getClientes';
import AddClientModal from './ComponentsClientes/AddClient';
import { usePermisos } from '@/routes';


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
      <Breadcrumb
        paths={[
          { name: 'Inicio', href: '/inicio' },
          { name: 'Clientes', href: '/clientes' },
        ]}
      />
      <hr className="mb-4" />
      <h1 className="text-4xl font-extrabold">Clientes</h1>
      <div className="flex items-center justify-between mt-5 mb-4">
        <div id="barcode-scanner" hidden style={{ width: '100%', height: '400px' }}></div>
        <h6 className="font-bold">Lista de Clientes</h6>
        <div className="relative w-2/4">
          <div className="absolute inset-y-0 start-0 top-0 flex items-center ps-3.5 pointer-events-none">
            <IoIosSearch className="w-4 h-4 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Ingrese nombres o razón social del cliente"
            className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full ps-10 p-2.5"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex gap-5">
          <Button
            color="primary"
            endContent={<FaPlus style={{ fontSize: '25px' }} />}
            onClick={handleModalAdd}
            disabled={!hasCreatePermission}
            className={!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}
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
          onEdit = {() => refetch(page, limit, docType, docNumber)}
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