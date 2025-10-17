import { useState, useEffect } from 'react';
import { ShowAlmacenes } from '@/pages/AlmacenG/ShowAlmacenes';
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import AlmacenesForm from './AlmacenesForm';
import { Button } from '@heroui/react';
import { usePermisos } from '@/routes';
import { Tooltip } from "@heroui/react";
import BarraSearch from "@/components/Search/Search";
import { getAlmacenes_A, deleteAlmacen } from '@/services/almacen.services';
import { ActionButton } from "@/components/Buttons/Buttons";

function Almacenes() {
  const [activeAdd, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [almacenes, setAlmacenes] = useState([]);

  const estadoToText = (estado) =>
    String(estado) === "1" ? "Activo" : "Inactivo";

  const handleModalAdd = () => setModalOpen(!activeAdd);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const { hasCreatePermission } = usePermisos();

  // Cargar almacenes solo una vez
  useEffect(() => {
    const fetchAlmacenes = async () => {
      const data = await getAlmacenes_A();
      setAlmacenes(data || []);
    };
    fetchAlmacenes();
  }, []);

  const handleAddAlmacen = (nuevoAlmacen) => {
    setAlmacenes(prev => [
      {
        ...nuevoAlmacen,
        estado_almacen: estadoToText(nuevoAlmacen.estado_almacen)
      },
      ...prev
    ]);
  };

  // Al editar almacén localmente
  const handleEditAlmacen = (id_almacen, updatedData) => {
    setAlmacenes(prev =>
      prev.map(almacen =>
        almacen.id_almacen === id_almacen
          ? { ...almacen, ...updatedData, estado_almacen: estadoToText(updatedData.estado_almacen) }
          : almacen
      )
    );
  };

  const handleDeleteAlmacen = async (id_almacen) => {
    const result = await deleteAlmacen(id_almacen);
    if (result === 1) {
      setAlmacenes(prev => prev.filter(almacen => almacen.id_almacen !== id_almacen));
    } else if (result === 2) {
      setAlmacenes(prev =>
        prev.map(almacen =>
          almacen.id_almacen === id_almacen
            ? { ...almacen, estado_almacen: "Inactivo" }
            : almacen
        )
      );
    }
  };

  return (
  <div className="min-h-[80vh] px-4 py-8 max-w-8xl mx-auto">
    <Toaster />
    <h1 className='text-4xl font-extrabold text-blue-900 mb-2'>Gestión de almacenes</h1>
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-5 mb-8">
      <h6 className="font-bold text-blue-700">Lista de Almacenes</h6>
      <BarraSearch
        placeholder="Ingrese un almacén"
        isClearable={true}
        className="h-10 text-sm w-full md:w-2/4"
        value={searchTerm}
        onChange={handleSearchChange}
      />
      <Tooltip content={hasCreatePermission ? "Agregar almacén" : "No tiene permisos para agregar almacenes"}>
      <ActionButton
        color="blue"
        icon={<FaPlus className="w-4 h-4 text-blue-500" />}
        onClick={handleModalAdd}
        disabled={!hasCreatePermission}
        size="sm"
        className={`h-10 px-4 font-semibold rounded-lg border-0 shadow-none bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-200 ${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ boxShadow: "none", border: "none" }}
      >
        Agregar almacén
      </ActionButton>
      </Tooltip>
    </div>
    <ShowAlmacenes
      searchTerm={searchTerm}
      almacenes={almacenes}
      onEdit={handleEditAlmacen}
      onDelete={handleDeleteAlmacen}
    />
    {activeAdd && (
      <AlmacenesForm
        modalTitle="Agregar Almacén"
        onClose={handleModalAdd}
        onSuccess={handleAddAlmacen}
        initialData={null}
      />
    )}
  </div>
);
}

export default Almacenes;