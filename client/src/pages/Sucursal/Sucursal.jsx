import { useEffect, useState } from 'react';
import SucursalForm from './SucursalForm';
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import ShowSucursales from './ShowSucursales';
import { Button } from "@heroui/react";
import { usePermisos } from '@/routes';
import BarraSearch from "@/components/Search/Search";
import { getSucursalData, insertSucursal, editSucursal, removeSucursal } from '@/services/sucursal.services';

function Sucursal() {
  const [sucursales, setSucursales] = useState([]);
  const [activeAdd, setModalOpen] = useState(false);
  const { hasCreatePermission } = usePermisos();

  // Input de búsqueda de sucursales
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  // Cargar sucursales solo una vez
  useEffect(() => {
    const fetchSucursales = async () => {
      const { sucursales } = await getSucursalData({});
      setSucursales(sucursales || []);
    };
    fetchSucursales();
  }, []);

  // Agregar sucursal (API + local)
  const addSucursal = async (nuevaSucursal) => {
    const ok = await insertSucursal(nuevaSucursal);
    if (ok) setSucursales(prev => [nuevaSucursal, ...prev]);
  };

  // Editar sucursal (API + local)
  const updateSucursalLocal = async (id, updatedData) => {
    const ok = await editSucursal({ id, ...updatedData });
    if (ok) setSucursales(prev => prev.map(s => s.id === id ? { ...s, ...updatedData } : s));
  };

  // Eliminar sucursal (API + local)
  const removeSucursalLocal = async (id) => {
    const ok = await removeSucursal(id);
    if (ok) setSucursales(prev => prev.filter(s => s.id !== id));
  };

  // Filtro visual
  const sucursalesFiltradas = sucursales.filter(s =>
    (s.nombre_sucursal || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-white via-blue-50/60 to-blue-100/60 rounded-2xl shadow border border-blue-100 px-8 py-10 max-w-8xl mx-auto">
      <Toaster />
      <hr className="mb-8 border-blue-100" />
      <h1 className='text-4xl font-extrabold text-blue-900 mb-2'>Sucursales</h1>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-5 mb-8">
        <h6 className="font-bold text-blue-700">Lista de Sucursales</h6>
        <BarraSearch
          placeholder="Ingrese una sucursal"
          isClearable={true}
          className="h-10 text-sm w-full md:w-2/4"
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
            Agregar sucursal
          </Button>
        </div>
      </div>
      <div className="bg-white/90 border border-blue-100 rounded-2xl shadow-sm p-8">
        <ShowSucursales
          searchTerm={searchTerm}
          sucursales={sucursalesFiltradas}
          addSucursal={addSucursal}
          updateSucursalLocal={updateSucursalLocal}
          removeSucursal={removeSucursalLocal}
        />
      </div>
      {/* Modal de Agregar Sucursal */}
      {activeAdd && (
        <SucursalForm
          modalTitle="Nueva Sucursal"
          onClose={() => setModalOpen(false)}
          onSuccess={addSucursal}
        />
      )}
    </div>
  );
}

export default Sucursal;