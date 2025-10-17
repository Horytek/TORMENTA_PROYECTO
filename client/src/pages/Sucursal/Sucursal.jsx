import { useEffect, useState } from 'react';
import SucursalForm from './SucursalForm';
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import ShowSucursales from './ShowSucursales';
import { Button } from "@heroui/react";
import { usePermisos } from '@/routes';
import BarraSearch from "@/components/Search/Search";
import { getSucursalData, insertSucursal, editSucursal, removeSucursal } from '@/services/sucursal.services';
import { ActionButton } from "@/components/Buttons/Buttons";

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
    <div className="min-h-[80vh] px-4 py-8 max-w-8xl mx-auto">
      <Toaster />
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
        <ActionButton
          color="blue"
          icon={<FaPlus className="w-4 h-4 text-blue-500" />}
          onClick={() => setModalOpen(true)}
          disabled={!hasCreatePermission}
          size="sm"
          className={`h-10 px-4 font-semibold rounded-lg border-0 shadow-none bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-200 ${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{ boxShadow: "none", border: "none" }}
        >
          Agregar sucursal
        </ActionButton>
      </div>
      <ShowSucursales
        searchTerm={searchTerm}
        sucursales={sucursalesFiltradas}
        addSucursal={addSucursal}
        updateSucursalLocal={updateSucursalLocal}
        removeSucursal={removeSucursalLocal}
      />
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