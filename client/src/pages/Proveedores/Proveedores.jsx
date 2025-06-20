import { useState, useEffect } from 'react';
import DestinatariosForm from './DestinatariosForm';
import { Toaster } from "react-hot-toast";
import { Button } from "@heroui/button";
import { FaPlus } from "react-icons/fa";
import { ShowDestinatarios } from '@/pages/Proveedores/ShowDestinatarios';
import { usePermisos } from '@/routes';
import BarraSearch from "@/components/Search/Search";
import { getDestinatarios } from '@/services/destinatario.services';

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
    <div>
      <Toaster />
      <h1 className='text-4xl font-extrabold'>Gestión de proveedores</h1>
      <div className="flex items-center justify-between mt-5 mb-4">
        <h6 className="font-bold">Lista de Proveedores</h6>
        <BarraSearch
          placeholder="Ingrese el nombre del proveedor"
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
            Agregar proveedor
          </Button>
        </div>
      </div>
      <div>
        <ShowDestinatarios
          searchTerm={searchTerm}
          destinatarios={destinatarios}
          updateDestinatarioLocal={updateDestinatarioLocal}
          removeDestinatario={removeDestinatario}
          onEdit={handleEdit}
        />
      </div>
      {/* Modal de Agregar Proveedor */}
      {activeAdd && (
        <DestinatariosForm
          modalTitle={'Nuevo Proveedor'}
          onClose={() => setModalOpen(false)}
          onSuccess={addDestinatario}
        />
      )}
      {/* Modal de Editar Proveedor */}
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