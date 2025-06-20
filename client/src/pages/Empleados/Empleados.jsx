import { useEffect, useState } from 'react';
import VendedoresForm from './VendedoresForm';
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import { ShowVendedores } from '@/pages/Empleados/ShowVendedores';
import { Button } from "@heroui/button";
import { usePermisos } from '@/routes';
import BarraSearch from "@/components/Search/Search";
import { getVendedores } from '@/services/vendedor.services';

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

  // Cargar vendedores solo una vez
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
    <div>
      <Toaster />
      <h1 className='text-4xl font-extrabold'>Gestión de empleados</h1>
      <div className="flex items-center justify-between mt-5 mb-4">
        <h6 className="font-bold">Lista de Empleados</h6>
        <BarraSearch
          placeholder="Ingrese un empleado"
          isClearable={true}
          className="h-9 text-sm w-2/4"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <div className="flex gap-5">
          <Button
            color="primary"
            endContent={<FaPlus style={{ fontSize: '25px' }} />}
            onClick={() => setModalOpen(true)}
            disabled={!hasCreatePermission}
            className={!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}
          >
            Agregar empleado
          </Button>
        </div>
      </div>
      <div>
        <ShowVendedores
          searchTerm={searchTerm}
          vendedores={vendedores}
          addVendedor={addVendedor}
          updateVendedorLocal={updateVendedorLocal}
          removeVendedor={removeVendedor}
        />
      </div>

      {/* Modal de Agregar Vendedor */}
      {activeAdd && (
        <VendedoresForm
          modalTitle={'Nuevo Vendedor'}
          onClose={() => setModalOpen(false)}
          onSuccess={addVendedor}
        />
      )}
    </div>
  );
}

export default Vendedores;