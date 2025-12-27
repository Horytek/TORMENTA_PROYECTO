import { useState, useCallback, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Button,
  Chip
} from "@heroui/react";
import UsuariosForm from './UsuariosForm';
import UserProfileModal from './UserProfileModal';
import { MdEdit } from "react-icons/md";
import { FaTrash, FaUser } from "react-icons/fa";
import {
  deleteUsuario, getUsuario,
  bulkUpdateUsuarios, toggleEstadoUsuario
} from '@/services/usuario.services';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import { usePermisos } from '@/routes';



export function ShowUsuarios({
  usuarios, // Already filtered
  addUsuario,
  updateUsuarioLocal,
  removeUsuario,
  selectedKeys,
  onSelectionChange,
  page = 1,
  limit = 10
}) {

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Pagination Logic using Props
  const currentUsuarios = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return usuarios.slice(start, end);
  }, [page, limit, usuarios]);

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

  const handleSuccessEdit = (id_usuario, updatedData) => {
    const usuarioVisual = {
      ...updatedData
      // contra: updatedData.contra // No need to manipulate visual password anymore
    };
    updateUsuarioLocal(id_usuario, usuarioVisual);
    setActiveEdit(false);
    setInitialData(null);
  };



  const { hasEditPermission, hasDeletePermission } = usePermisos();

  // Handlers para el modal de perfil
  const handleViewProfile = (usuario) => {
    setSelectedUser(usuario);
    setProfileModalOpen(true);
  };

  const handleToggleStatus = async (usuario) => {
    const action = (usuario.estado_usuario === 'Activo' || usuario.estado_usuario === 1 || usuario.estado_usuario === '1') ? 'deactivate' : 'activate';
    const success = await bulkUpdateUsuarios(action, [usuario.id_usuario]);
    if (success) {
      updateUsuarioLocal(usuario.id_usuario, { estado_usuario: action === 'activate' ? 1 : 0 });
    }
    setProfileModalOpen(false);
  };

  const handleDeleteFromModal = async (usuario) => {
    setSelectedRow(usuario.usua);
    setSelectedId(usuario.id_usuario);
    setIsConfirmationModalOpen(true);
    setProfileModalOpen(false);
  };

  const columns = [
    { name: "USUARIO", uid: "usuario" },
    { name: "ROL", uid: "rol", sortable: true },

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
  }, [hasEditPermission, hasDeletePermission, handleViewProfile]);

  return (
    <>
      <div className="w-full">
        <Table
          aria-label="Tabla de usuarios"
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={onSelectionChange}
          removeWrapper
          classNames={{
            base: "",
            table: "min-w-full",
            th: "bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider h-10 first:rounded-l-lg last:rounded-r-lg",
            td: "py-3 border-b border-slate-100 dark:border-zinc-800",
            tr: "hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors",
            thead: "[&>tr]:first:shadow-none",
          }}
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
    </>
  );
}

export default ShowUsuarios;