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
    <div className="min-h-[80vh] bg-gradient-to-b from-white via-blue-50/60 to-blue-100/60 rounded-2xl shadow border border-blue-100 px-8 py-10 max-w-8xl mx-auto">
      <Toaster />
      <h1 className='text-4xl font-extrabold text-blue-900 mb-2'>Gestión de empleados</h1>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-5 mb-8">
        <h6 className="font-bold text-blue-700">Lista de Empleados</h6>
        <BarraSearch
          placeholder="Ingrese un empleado"
          isClearable={true}
          className="h-10 text-sm w-full md:w-2/4 bg-white border border-blue-100 rounded-lg shadow-sm"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <div className="flex gap-5">
          <Button
            color="primary"
            endContent={<FaPlus style={{ fontSize: '25px' }} />}
            onClick={() => setModalOpen(true)}
            disabled={!hasCreatePermission}
            className={`h-10 px-5 font-semibold rounded-lg shadow-sm bg-blue-600 hover:bg-blue-700 text-white transition ${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Agregar empleado
          </Button>
        </div>
      </div>
      <div className="bg-white/90 border border-blue-100 rounded-2xl shadow-sm p-8">
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