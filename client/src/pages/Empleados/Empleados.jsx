import { useEffect, useState } from 'react';
import VendedoresForm from './VendedoresForm';
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import { ShowVendedores } from '@/pages/Empleados/ShowVendedores';
import { Button, Tabs, Tab, Card, CardBody } from '@heroui/react';
import { usePermisos } from '@/routes';
import BarraSearch from "@/components/Search/Search";
import { getVendedores } from '@/services/vendedor.services';
// Importa el nuevo componente de pagos
import PagosEmpleados from './PagosEmpleados';
import { ActionButton } from "@/components/Buttons/Buttons";


function Vendedores() {
  const [vendedores, setVendedores] = useState([]);
  const [activeAdd, setModalOpen] = useState(false);
  const { hasCreatePermission } = usePermisos();

  const transformVendedor = (vendedor) => ({
    ...vendedor,
    estado_vendedor:
      vendedor.estado_vendedor === 1 || vendedor.estado_vendedor === "1"
        ? "Activo"
        : "Inactivo",
    nombre: (vendedor.nombres || "") + (vendedor.apellidos ? " " + vendedor.apellidos : ""),
  });

  // Input de búsqueda de vendedores
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  // Tab activo
  const [selectedTab, setSelectedTab] = useState("empleados");

  useEffect(() => {
    const fetchVendedores = async () => {
      const data = await getVendedores();
      setVendedores(data);
    };
    fetchVendedores();
  }, []);

  // Al agregar vendedor
  const addVendedor = (nuevoVendedor) => {
    setVendedores(prev => [transformVendedor(nuevoVendedor), ...prev]);
  };

  // Al actualizar vendedor
  const updateVendedorLocal = (dni, updatedData) => {
    setVendedores(prev =>
      prev.map(v =>
        v.dni === dni ? { ...v, ...transformVendedor(updatedData) } : v
      )
    );
  };

  // Eliminar vendedor del array local
  const removeVendedor = (dni) => {
    setVendedores(prev => prev.filter(v => v.dni !== dni));
  };

  return (
    <>
      <Toaster />
      <div className="mx-2 md:mx-6 my-4">
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={setSelectedTab}
          color="primary"
          className="mb-6"
        >
          <Tab key="empleados" title="Empleados" />
          <Tab key="pagos" title="Pagos de empleados" />
        </Tabs>
        {selectedTab === "empleados" && (
          <>
            <h1 className='text-4xl font-extrabold text-blue-900 mb-2'>Gestión de empleados</h1>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-5 mb-8">
              <h6 className="font-bold text-blue-700">Lista de Empleados</h6>
              <BarraSearch
                placeholder="Ingrese un empleado"
                isClearable={true}
                className="h-10 text-sm w-full md:w-2/4"
                value={searchTerm}
                onChange={handleSearchChange}
              />
                <ActionButton
                  color="blue"
                  icon={<FaPlus className="w-4 h-4 text-blue-500" />}
                  onClick={() => setModalOpen(true)}
                  disabled={!hasCreatePermission}
                  size="sm"
                  className={`h-10 px-4 font-semibold rounded-lg border-0 shadow-none bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-200 ${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{ boxShadow: "none", border: "none" }}
                >
                  Agregar empleado
                </ActionButton>
            </div>
            <ShowVendedores
              searchTerm={searchTerm}
              vendedores={vendedores}
              addVendedor={addVendedor}
              updateVendedorLocal={updateVendedorLocal}
              removeVendedor={removeVendedor}
            />
            {activeAdd && (
              <VendedoresForm
                modalTitle={'Nuevo Vendedor'}
                onClose={() => setModalOpen(false)}
                onSuccess={addVendedor}
              />
            )}
          </>
        )}
        {selectedTab === "pagos" && (
          <Card className="mt-2">
            <CardBody>
              <PagosEmpleados vendedores={vendedores} />
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}

export default Vendedores;