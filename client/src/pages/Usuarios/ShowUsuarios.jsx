import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Pagination,
  Button,
  Chip,
  ScrollShadow,
  Checkbox
} from "@heroui/react";
import UsuariosForm from './UsuariosForm';
import UserProfileModal from './UserProfileModal';
import BulkActionsToolbar from './components/BulkActionsToolbar';
import { MdEdit } from "react-icons/md";
import { FaTrash, FaEye, FaEyeSlash, FaUser } from "react-icons/fa";
import { getUsuarios, deleteUsuario, getUsuario,
  bulkUpdateUsuarios, toggleEstadoUsuario } from '@/services/usuario.services';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import { VscDebugDisconnect } from "react-icons/vsc";
import { PiPlugsConnected } from "react-icons/pi";
import { usePermisos } from '@/routes';

// Utilidad para mostrar el hash visualmente (solo para frontend)
function fakeBcryptHash(password) {
  // Si ya es hash, retorna igual
  if (/^\$2[aby]\$\d{2}\$.{53}$/.test(password)) return password;
  // Simula hash visual (no real, solo para mostrar)
  return `$2b$12$${btoa(password).slice(0, 22)}${'x'.repeat(31)}`;
}

export function ShowUsuarios({ searchTerm, activeFilters = {}, usuarios, addUsuario, updateUsuarioLocal, removeUsuario }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [showPassword, setShowPassword] = useState({});
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const usuariosPerPage = 10;

  // Aplicar filtros avanzados y búsqueda
  const filteredUsuarios = useMemo(() => {
    if (!Array.isArray(usuarios)) return [];

    return usuarios.filter(usuario => {
      // Filtro de búsqueda
      const matchesSearch = usuario.usua.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Filtro de rol
      if (activeFilters.role && usuario.id_rol != activeFilters.role) {
        return false;
      }

      // Filtro de estado
      if (activeFilters.status !== undefined && activeFilters.status !== '') {
        const isActive = usuario.estado_usuario === 1 || usuario.estado_usuario === "1" || usuario.estado_usuario === "Activo";
        const filterActive = activeFilters.status === "1";
        if (isActive !== filterActive) return false;
      }

      // Filtro de conexión
      if (activeFilters.connection !== undefined && activeFilters.connection !== '') {
        const filterConnected = activeFilters.connection === "1";
        if (usuario.estado_token != (filterConnected ? 1 : 0)) return false;
      }

      return true;
    });
  }, [usuarios, searchTerm, activeFilters]);

  // Usuarios a mostrar en la página actual
  const indexOfLastUsuario = currentPage * usuariosPerPage;
  const indexOfFirstUsuario = indexOfLastUsuario - usuariosPerPage;
  const currentUsuarios = filteredUsuarios.slice(indexOfFirstUsuario, indexOfLastUsuario);

  // Eliminar usuario solo en el array local
  const deleteUser = async (id) => {
    await deleteUsuario(id);
    removeUsuario(id);
  };

  // Estado de Modal de Edición de Producto
  const [activeEdit, setActiveEdit] = useState(false);
  const [initialData, setInitialData] = useState(null);

  const handleModalEdit = async (id_usuario) => {
    const data = await getUsuario(id_usuario);
    if (data && data[0]) {
      setInitialData({
        id_usuario: parseInt(id_usuario),
        data: data[0]
      });
      setActiveEdit(true);
    }
  };

  // Estados de modal de eliminación de producto
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const handleOpenConfirmationModal = (row, id_usuario) => {
    setSelectedRow(row);
    setSelectedId(id_usuario);
    setIsConfirmationModalOpen(true);
  };
  const handleCloseConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
    setSelectedRow(null);
  };

  const handleConfirmDelete = () => {
    deleteUser(selectedId);
    handleCloseConfirmationModal();
  };

  const handleCloseModal = () => {
    setActiveEdit(false);
    setInitialData(null);
  };

  const handleSuccessEdit = (id_usuario, updatedData) => {
    const usuarioVisual = {
      ...updatedData,
      contra: fakeBcryptHash(updatedData.contra)
    };
    updateUsuarioLocal(id_usuario, usuarioVisual);
    setActiveEdit(false);
    setInitialData(null);
  };

  const handleSuccessAdd = (nuevoUsuario) => {
    const usuarioVisual = {
      ...nuevoUsuario,
      contra: fakeBcryptHash(nuevoUsuario.contra)
    };
    addUsuario(usuarioVisual);
    setActiveEdit(false);
    setInitialData(null);
  };

  const togglePasswordVisibility = (id_usuario) => {
    setShowPassword(prevState => ({
      ...prevState,
      [id_usuario]: !prevState[id_usuario]
    }));
  };

  const { hasEditPermission, hasDeletePermission } = usePermisos();

  // Handlers para el modal de perfil
  const handleViewProfile = (usuario) => {
    setSelectedUser(usuario);
    setProfileModalOpen(true);
  };

  // Edit se mantiene pero se moverá dentro del modal, ya no botón directo
  const handleToggleStatus = async (usuario) => {
    const action = (usuario.estado_usuario === 'Activo' || usuario.estado_usuario === 1 || usuario.estado_usuario === '1') ? 'deactivate' : 'activate';
    const success = await bulkUpdateUsuarios(action, [usuario.id_usuario]);
    if (success) {
      updateUsuarioLocal(usuario.id_usuario, { estado_usuario: action === 'activate' ? 1 : 0 });
    }
    setProfileModalOpen(false);
  };

  const handleToggleEstado = async (usuario) => {
  const estadoActual = (usuario.estado_usuario === 1 || usuario.estado_usuario === '1');
  const nuevoEstado = estadoActual ? 0 : 1;
  const ok = await toggleEstadoUsuario(usuario.id_usuario, nuevoEstado);
  if (ok) {
    updateUsuarioLocal(usuario.id_usuario, { estado_usuario: nuevoEstado });
  }
};

  const handleDeleteFromModal = async (usuario) => {
    // Reutiliza lógica existente de confirmación masiva para consistencia visual
    setSelectedRow(usuario.usua);
    setSelectedId(usuario.id_usuario);
    setIsConfirmationModalOpen(true);
    setProfileModalOpen(false);
  };

  // Handlers para selección masiva
  const handleSelectionChange = (id) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === currentUsuarios.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(currentUsuarios.map(u => u.id_usuario));
      setSelectedIds(allIds);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.size === 0) return;

    if (action === 'delete') {
      setIsBulkDeleteModalOpen(true);
      return;
    }

    await executeBulkAction(action);
  };

  const executeBulkAction = async (action) => {
    const idsArray = Array.from(selectedIds);
    const success = await bulkUpdateUsuarios(action, idsArray);

    if (success) {
      // Actualizar estado local
      if (action === 'delete') {
        idsArray.forEach(id => removeUsuario(id));
      } else {
        const numericValue = action === 'activate' ? 1 : 0;
        idsArray.forEach(id => {
          updateUsuarioLocal(id, { estado_usuario: numericValue });
        });
      }
      setSelectedIds(new Set());
    }
    if (action === 'delete') setIsBulkDeleteModalOpen(false);
  };

  const renderCell = useCallback((usuario, columnKey) => {
    switch (columnKey) {
      case "select":
        return (
          <Checkbox
            isSelected={selectedIds.has(usuario.id_usuario)}
            onValueChange={() => handleSelectionChange(usuario.id_usuario)}
            aria-label="Seleccionar usuario"
          />
        );
      case "rol":
        return usuario.nom_rol;
      case "usuario":
        return (
          <Tooltip content={usuario.estado_token == 1 ? "Conectado" : "Desconectado"}>
            <div className="flex items-center gap-3">
              <div
                className={`
                                    flex items-center justify-center w-9 h-9 rounded-full border-2 shadow-sm
                                    transition-all duration-200
                                    ${usuario.estado_token === 1
                    ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/30"
                    : "border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-900/30"
                  }
                                `}
              >
                {usuario.estado_token === 1 ? (
                  <PiPlugsConnected className="text-emerald-500 dark:text-emerald-300 text-xl" />
                ) : (
                  <VscDebugDisconnect className="text-rose-500 dark:text-rose-300 text-xl" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-blue-900 dark:text-blue-100 text-[15px] leading-tight">{usuario.usua}</span>
                <span className={`text-xs font-medium flex items-center gap-1
                                    ${usuario.estado_token === 1
                    ? "text-emerald-600 dark:text-emerald-200"
                    : "text-rose-600 dark:text-rose-200"
                  }`}>
                  <span className={`inline-block w-2 h-2 rounded-full
                                        ${usuario.estado_token === 1
                      ? "bg-emerald-400 dark:bg-emerald-500"
                      : "bg-rose-400 dark:bg-rose-500"
                    }`}></span>
                  {usuario.estado_token === 1 ? "Conectado" : "Desconectado"}
                </span>
              </div>
            </div>
          </Tooltip>
        );
      case "contraseña":
        return (
          <div className="flex">
            <button
              className="flex justify-center items-center gap-x-1.5"
              onClick={() => togglePasswordVisibility(usuario.id_usuario)}
              tabIndex={-1}
              aria-label="Mostrar/ocultar contraseña"
            >
              <span className="mr-2 font-mono tracking-widest select-none">
                {/* Nunca mostrar la contraseña real, solo puntos */}
                {showPassword[usuario.id_usuario]
                  ? "●●●●●●●●"
                  : "●●●●●●●●"}
              </span>
              <span className='text-gray-500 dark:text-gray-300'>
                {showPassword[usuario.id_usuario] ? <FaEyeSlash /> : <FaEye />}
              </span>
            </button>
          </div>
        );
      case "estado":
        return (
          <span className={`
                        inline-flex items-center gap-x-1 py-0.5 px-2 rounded-full text-[12px] font-semibold
                        border
                        ${usuario.estado_usuario === 'Inactivo'
              ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-700/60"
              : "bg-green-100 text-green-700 border-green-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700/60"
            }
                    `}>
            {usuario.estado_usuario === 'Inactivo' ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {usuario.estado_usuario}
          </span>
        );
      case "acciones":
        return (
          <div className="flex items-center justify-center">
            <Tooltip content="Ver detalle usuario">
              <Button
                isIconOnly
                variant="light"
                color="primary"
                onClick={() => handleViewProfile(usuario)}
                className="cursor-pointer"
              >
                <FaUser />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return usuario[columnKey];
    }
  }, [showPassword, hasEditPermission, hasDeletePermission, handleViewProfile, selectedIds, handleSelectionChange]);

  return (
    <>
      <div className="bg-white/90 dark:bg-[#18192b] rounded-2xl shadow border border-blue-100 dark:border-zinc-700 p-0">
        <div className="p-4 bg-white dark:bg-[#232339] rounded-2xl">
          <ScrollShadow hideScrollBar>
            <table className="min-w-full border-collapse rounded-2xl overflow-hidden text-[13px]">
              <thead>
                <tr className="bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 text-[13px] font-bold">
                  <th className="py-2 px-2 text-center w-10">
                    <Checkbox
                      isSelected={selectedIds.size === currentUsuarios.length && currentUsuarios.length > 0}
                      isIndeterminate={selectedIds.size > 0 && selectedIds.size < currentUsuarios.length}
                      onValueChange={handleSelectAll}
                      aria-label="Seleccionar todos"
                    />
                  </th>
                  <th className="py-2 px-2 text-left">Rol</th>
                  <th className="py-2 px-2 text-left">Usuario</th>
                  <th className="py-2 px-2 text-left">Contraseña</th>
                  <th className="py-2 px-2 text-center">Estado</th>
                  <th className="py-2 px-2 text-center w-24">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 dark:text-gray-500">Sin usuarios para mostrar</td>
                  </tr>
                ) : (
                  currentUsuarios.map((usuario, idx) => (
                    <tr
                      key={usuario.id_usuario}
                      className={`transition-colors duration-150 ${idx % 2 === 0
                        ? "bg-white dark:bg-[#18192b]"
                        : "bg-blue-50/40 dark:bg-blue-900/10"
                        } hover:bg-blue-100/60 dark:hover:bg-blue-900/30`}
                    >
                      {["select", "rol", "usuario", "contraseña", "estado", "acciones"].map((columnKey) => (
                        <td
                          key={columnKey}
                          className={`py-1.5 px-2 ${columnKey === "estado" || columnKey === "acciones" || columnKey === "select" ? "text-center" : ""}`}
                        >
                          {renderCell(usuario, columnKey)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ScrollShadow>
        </div>
      </div>
      <div className="flex justify-between items-center mt-2 px-4 pb-2">
        <Pagination
          showControls
          page={currentPage}
          total={Math.ceil(filteredUsuarios.length / usuariosPerPage) || 1}
          onChange={(page) => setCurrentPage(page)}
          color="primary"
          size="sm"
        />
        <div className="text-xs text-gray-400">
          Mostrando {currentUsuarios.length} de {filteredUsuarios.length} usuarios
        </div>
      </div>
      {/* Modal de Confirmación para eliminar Producto */}
      {isConfirmationModalOpen && (
        <ConfirmationModal
          message={`¿Estás seguro que deseas eliminar "${selectedRow}"?`}
          onClose={handleCloseConfirmationModal}
          onConfirm={handleConfirmDelete}
        />
      )}
      {/* Modal de Confirmación para eliminación masiva */}
      {isBulkDeleteModalOpen && (
        <ConfirmationModal
          message={`¿Estás seguro que deseas eliminar ${selectedIds.size} usuarios seleccionados? Esta acción no se puede deshacer.`}
          onClose={() => setIsBulkDeleteModalOpen(false)}
          onConfirm={() => executeBulkAction('delete')}
        />
      )}
      {/* Modal de Editar Producto */}
      {activeEdit && (
        <UsuariosForm
          modalTitle="Editar Usuario"
          onClose={() => setActiveEdit(false)}
          initialData={initialData}
          onSuccess={handleSuccessEdit}
          usuarios={usuarios}
        />
      )}
      {/* Modal de Perfil de Usuario */}
      {profileModalOpen && selectedUser && (
        <UserProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          usuario={selectedUser}
          onEdit={handleModalEdit}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteFromModal}
        />
      )}

      <BulkActionsToolbar
        selectedCount={selectedIds.size}
        onActivate={() => handleBulkAction('activate')}
        onDeactivate={() => handleBulkAction('deactivate')}
        onDelete={() => handleBulkAction('delete')}
        onClearSelection={() => setSelectedIds(new Set())}
      />
    </>
  );
}

export default ShowUsuarios;