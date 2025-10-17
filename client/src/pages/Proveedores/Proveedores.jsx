import { useState, useEffect } from 'react';
import DestinatariosForm from './DestinatariosForm';
import { Toaster } from "react-hot-toast";
import { Button } from '@heroui/react';
import { FaPlus } from "react-icons/fa";
import { ShowDestinatarios } from '@/pages/Proveedores/ShowDestinatarios';
import { usePermisos } from '@/routes';
import BarraSearch from "@/components/Search/Search";
import { getDestinatarios } from '@/services/destinatario.services';
import { ActionButton } from "@/components/Buttons/Buttons";


function Proveedores() {
  const [destinatarios, setDestinatarios] = useState([]);
  const [activeAdd, setModalOpen] = useState(false);
  const [activeEdit, setActiveEdit] = useState(false);
  const [editData, setEditData] = useState(null);

  const { hasCreatePermission } = usePermisos();

  // Input de búsqueda de proveedores
  const [searchTerm, setSearchTerm] = useState('');
  const handleSearchChange = (e) => {
    const value = e.target.value;
    if (/^[A-Za-z\s]*$/.test(value)) {
      setSearchTerm(value);
    }
  };

  // Cargar destinatarios solo una vez
  useEffect(() => {
    const fetchDestinatarios = async () => {
      const data = await getDestinatarios();
      setDestinatarios(data || []);
    };
    fetchDestinatarios();
  }, []);

  // Agregar destinatario localmente
  const addDestinatario = (nuevoDestinatario) => {
    setDestinatarios(prev => [nuevoDestinatario, ...prev]);
  };

  // Editar destinatario localmente
  const updateDestinatarioLocal = (id, updatedData) => {
    setDestinatarios(prev =>
      prev.map(d =>
        d.id === id ? { ...d, ...updatedData } : d
      )
    );
  };

  // Eliminar destinatario localmente
  const removeDestinatario = (id) => {
    setDestinatarios(prev => prev.filter(d => d.id !== id));
  };

  // Abrir modal de edición
  const handleEdit = (data) => {
    setEditData(data);
    setActiveEdit(true);
  };

  // Cerrar modal de edición
  const handleCloseEdit = () => {
    setEditData(null);
    setActiveEdit(false);
  };

 return (
  <div className="m-4">
    <Toaster />
    <h1 className='text-4xl font-extrabold text-blue-900 mb-2'>Gestión de proveedores</h1>
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-5 mb-8">
      <h6 className="font-bold text-blue-700">Lista de Proveedores</h6>
      <BarraSearch
        placeholder="Ingrese el nombre del proveedor"
        isClearable={true}
        className="h-10 text-sm w-full md:w-2/4 bg-white"
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
        Agregar proveedor
      </ActionButton>
    </div>
    <ShowDestinatarios
      searchTerm={searchTerm}
      destinatarios={destinatarios}
      updateDestinatarioLocal={updateDestinatarioLocal}
      removeDestinatario={removeDestinatario}
      onEdit={handleEdit}
    />
    {activeAdd && (
      <DestinatariosForm
        modalTitle={'Nuevo Proveedor'}
        onClose={() => setModalOpen(false)}
        onSuccess={addDestinatario}
      />
    )}
    {activeEdit && (
      <DestinatariosForm
        modalTitle={'Editar Proveedor'}
        onClose={handleCloseEdit}
        initialData={editData}
        onSuccess={(updatedData) => {
          updateDestinatarioLocal(updatedData.id, updatedData);
          handleCloseEdit();
        }}
      />
    )}
  </div>
);
}

export default Proveedores;