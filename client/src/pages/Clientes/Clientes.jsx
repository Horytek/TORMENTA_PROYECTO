import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
// import ClientesForm from './ClientesForm';
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
import { Button } from "@nextui-org/button";
import TablaCliente from '@/pages/Clientes/ComponentsClientes/TablaCliente';
import useGetClientes from './data/getClientes';
import AddClientModal from './ComponentsClientes/AddClient';

function Clientes() {
  // Estado de Modal de Agregar Cliente
  const [activeAdd, setModalOpen] = useState(false);
  const handleModalAdd = () => {
    setModalOpen(!activeAdd);
  };

  // Input de búsqueda de clientes
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5); 
  const { clientes, metadata, loading, error, refetch } = useGetClientes(page, limit);

  const changePage = (newPage) => {
    setPage(newPage);
    refetch(newPage, limit);
  };

  const changeLimit = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
    refetch(1, newLimit);
  };

  return (
    <div>
      <Toaster />
      <Breadcrumb
        paths={[
          { name: 'Inicio', href: '/inicio' },
          { name: 'Clientes', href: '/configuracion/clientes' },
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
            placeholder="Ingrese un cliente"
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
          metadata={metadata}
          page={page}
          limit={limit}
          changePage={changePage}
          changeLimit={changeLimit}
          onDelete={() => refetch(page, limit)}
        />
      </div>

      <AddClientModal open={activeAdd} onClose={handleModalAdd} />

    </div>
  );
}

export default Clientes;