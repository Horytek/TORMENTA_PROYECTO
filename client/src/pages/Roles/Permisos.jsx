import { useState } from 'react';
import TablaPermisos from './ComponentsPermisos/TablaPermisos';

export function Permisos({ searchTerm }) {
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [activeEdit, setActiveEdit] = useState(false);
  const [initialData, setInitialData] = useState(null);

  // Modal handlers
  const handleOpenConfirmationModal = (row, id) => {
    setSelectedRow(row);
    setSelectedId(id);
    setIsConfirmationModalOpen(true);
  };

  const handleCloseConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
    setSelectedRow(null);
  };

  const handleConfirmDelete = () => {
    // Implementar lógica de eliminación
    handleCloseConfirmationModal();
  };

  const handleModalEdit = async (id) => {
    // Implementar lógica de edición
    setActiveEdit(true);
  };

  const handleCloseModal = () => {
    setActiveEdit(false);
    setInitialData(null);
  };

  return (
    <div className="w-full">
      <TablaPermisos 
        searchTerm={searchTerm}
        onEdit={handleModalEdit}
        onDelete={handleOpenConfirmationModal}
      />

      {/* Modals */}
      {isConfirmationModalOpen && (
        <ConfirmationModal
          message={`¿Estás seguro que deseas eliminar "${selectedRow}"?`}
          onClose={handleCloseConfirmationModal}
          onConfirm={handleConfirmDelete}
        />
      )}

      {activeEdit && (
        <PermisosForm 
          modalTitle={'Editar Permiso'} 
          onClose={handleCloseModal}
          initialData={initialData} 
        />
      )}
    </div>
  );
}

export default Permisos;