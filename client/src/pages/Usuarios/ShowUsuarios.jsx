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
import BulkActionsToolbar from '@/components/Shared/BulkActionsToolbar';
import { MdEdit } from "react-icons/md";
import { FaTrash, FaEye, FaEyeSlash, FaUser } from "react-icons/fa";
import {
  getUsuarios, deleteUsuario, getUsuario,
  bulkUpdateUsuarios, toggleEstadoUsuario
} from '@/services/usuario.services';
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
  const getSelectedIdsArray = () => {
    if (selectedIds === "all") {
      return filteredUsuarios.map(u => u.id_usuario);
    }
    return Array.from(selectedIds);
  };

  const handleBulkAction = async (action) => {
    const ids = getSelectedIdsArray();
    if (ids.length === 0) return;

    if (action === 'delete') {
      setIsBulkDeleteModalOpen(true);
      return;
    }

    await executeBulkAction(action);
  };

  const executeBulkAction = async (action) => {
    const idsArray = getSelectedIdsArray();
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

  const columns = [
    { name: "USUARIO", uid: "usuario" },
    { name: "ROL", uid: "rol", sortable: true },
    { name: "CONTRASEÑA", uid: "contraseña" },
    { name: "ESTADO", uid: "estado", sortable: true },
    { name: "ACCIONES", uid: "acciones", align: "center" },
  ];

  const renderCell = useCallback((usuario, columnKey) => {
    switch (columnKey) {
      case "rol":
        return (
          <Chip size="sm" variant="flat" color="primary" className="font-bold">
            {usuario.nom_rol}
          </Chip>
        );
      case "usuario":
        return (
          <div className="flex items-center gap-3">
            <div
              className={`
                    flex items-center justify-center w-8 h-8 rounded-lg border shadow-sm
                    transition-all duration-200
                    ${usuario.estado_token === 1
                  ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "border-slate-200 bg-slate-50 text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-slate-500"
                }
                `}
            >
              <FaUser size={14} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{usuario.usua}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1
                                ${usuario.estado_token === 1
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-400 dark:text-slate-500"
                }`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full
                                    ${usuario.estado_token === 1
                    ? "bg-emerald-500"
                    : "bg-slate-400"
                  }`}></span>
                {usuario.estado_token === 1 ? "Conectado" : "Offline"}
              </span>
            </div>
          </div>
        );
      case "contraseña":
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-widest">
              {showPassword[usuario.id_usuario] ? usuario.contra : "••••••••"}
            </span>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              onClick={() => togglePasswordVisibility(usuario.id_usuario)}
            >
              {showPassword[usuario.id_usuario] ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
            </Button>
          </div>
        );
      case "estado":
        const isActive = usuario.estado_usuario === 1 || usuario.estado_usuario === "1" || usuario.estado_usuario === "Activo";
        return (
          <Chip
            className="gap-1 border-none capitalize"
            color={isActive ? "success" : "danger"}
            size="sm"
            variant="flat"
            startContent={
              <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-success-600' : 'bg-danger-600'} ml-1`}></span>
            }
          >
            {isActive ? "Activo" : "Inactivo"}
          </Chip>
        );
      case "acciones":
        return (
          <div className="relative flex items-center justify-center gap-2">
            <Tooltip content="Ver perfil">
              <span className="text-lg text-default-400 cursor-pointer active:opacity-50" onClick={() => handleViewProfile(usuario)}>
                <FaUser />
              </span>
            </Tooltip>
          </div>
        );
      default:
        return usuario[columnKey];
    }
  }, [showPassword, hasEditPermission, hasDeletePermission, handleViewProfile]);

  return (
    <>
      <div className="w-full">
        <Table
          aria-label="Tabla de usuarios"
          selectionMode="multiple"
          selectedKeys={selectedIds}
          onSelectionChange={setSelectedIds}
          removeWrapper
          classNames={{
            base: "max-h-[calc(100vh-300px)] overflow-y-auto",
            table: "min-w-full",
            th: "bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider h-10 first:rounded-l-lg last:rounded-r-lg",
            td: "py-3 border-b border-slate-100 dark:border-zinc-800",
            tr: "hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors",
            thead: "[&>tr]:first:shadow-none",
          }}
          bottomContent={
            <div className="flex w-full justify-between items-center mt-4">
              <span className="text-small text-default-400">
                {selectedIds === "all"
                  ? "Todos los items seleccionados"
                  : `${selectedIds.size} de ${filteredUsuarios.length} seleccionados`}
              </span>
              <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={currentPage}
                total={Math.ceil(filteredUsuarios.length / usuariosPerPage) || 1}
                onChange={setCurrentPage}
              />
              <span className="text-small text-default-400 w-[20%] text-right">
                {currentUsuarios.length} de {filteredUsuarios.length} usuarios
              </span>
            </div>
          }
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.uid} align={column.uid === "acciones" ? "center" : "start"}>
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={currentUsuarios} emptyContent={"No se encontraron usuarios"}>
            {(item) => (
              <TableRow key={item.id_usuario}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>
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

      {selectedIds.size > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedIds === "all" ? filteredUsuarios.length : selectedIds.size}
          onActivate={() => handleBulkAction('activate')}
          onDeactivate={() => handleBulkAction('deactivate')}
          onDelete={() => handleBulkAction('delete')}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}
    </>
  );
}

export default ShowUsuarios;