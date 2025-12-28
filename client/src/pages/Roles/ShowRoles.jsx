import { useEffect, useState, useCallback } from 'react';
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
  Spinner
} from "@heroui/react";
import { MdEdit } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { getRoles, deleteRol, getRol, addRol, updateRol } from '@/services/rol.services';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import RolesForm from './RolesForm';
import { usePermisos } from '@/routes';

export default function ShowRoles({ searchTerm }) {
  // Estados de listado de usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const usuariosPerPage = 10;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getUsers();
  }, []);

  // Obtener usuarios mediante API
  const getUsers = async () => {
    try {
      setIsLoading(true);
      const data = await getRoles();
      if (data) {
        // Excluir el rol "administrador"
        const filteredRoles = data.filter((rol) => rol.nom_rol.toLowerCase() !== "administrador");
        setUsuarios(filteredRoles);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar usuarios
  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.nom_rol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Usuarios a mostrar en la página actual
  const indexOfLastUsuario = currentPage * usuariosPerPage;
  const indexOfFirstUsuario = indexOfLastUsuario - usuariosPerPage;
  const currentUsuarios = filteredUsuarios.slice(indexOfFirstUsuario, indexOfLastUsuario);

  // Eliminar usuario del array local
  const deleteUser = async (id) => {
    const success = await deleteRol(id);
    if (success) {
      setUsuarios(prev => prev.filter(u => u.id_rol !== id));
    }
  };

  // Estado de Modal de Edición de Producto
  const [activeEdit, setActiveEdit] = useState(false);
  const [initialData, setInitialData] = useState(null);

  const handleModalEdit = async (id_rol) => {
    const data = await getRol(id_rol);
    if (data) {
      setInitialData({
        id_rol: parseInt(id_rol),
        data: data
      });
      setActiveEdit(true);
    }
  };

  // Estados de modal de eliminación de producto
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const handleOpenConfirmationModal = (row, id_rol) => {
    setSelectedRow(row);
    setSelectedId(id_rol);
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

  // Modal de registro de rol
  // Note: activeAdd logic was moved to parent (TablaRoles), but ShowRoles handles edit internally.
  // Actually, TablaRoles handles New Role. ShowRoles handles Edit.

  // Actualizar rol en el array local
  const handleUpdateRolLocal = async (id_rol, updatedData) => {
    const result = await updateRol(id_rol, updatedData);
    if (result) {
      setUsuarios(prev =>
        prev.map(u =>
          u.id_rol === id_rol
            ? { ...u, ...updatedData, estado_rol: updatedData.estado_rol === 1 ? "Activo" : "Inactivo" }
            : u
        )
      );
      setActiveEdit(false);
      setInitialData(null);
      getUsers(); // Refresh to be safe
    }
  };

  const { hasEditPermission, hasDeletePermission } = usePermisos();

  const columns = [
    { name: "ID", uid: "id", sortable: true },
    { name: "ROL", uid: "rol", sortable: true },
    { name: "ESTADO", uid: "estado", sortable: true, align: "center" },
    { name: "ACCIONES", uid: "acciones", align: "center" },
  ];

  const renderCell = useCallback((usuario, columnKey) => {
    switch (columnKey) {
      case "id":
        return <span className="text-slate-500 font-mono text-xs">{usuario.id_rol}</span>;
      case "rol":
        return (
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {usuario.nom_rol}
          </span>
        );
      case "estado":
        const isActive = usuario.estado_rol === 'Activo' || usuario.estado_rol === 1 || usuario.estado_rol === "1";
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
          <div className="flex justify-center items-center gap-2">
            <Tooltip content={hasEditPermission ? "Editar" : "No tiene permisos"}>
              <span className={!hasEditPermission ? "opacity-50 cursor-not-allowed" : ""}>
                <Button
                  isIconOnly
                  variant="light"
                  color="primary"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); hasEditPermission ? handleModalEdit(usuario.id_rol) : null; }}
                  isDisabled={!hasEditPermission}
                >
                  <MdEdit size={18} />
                </Button>
              </span>
            </Tooltip>
            <Tooltip content={hasDeletePermission ? "Eliminar" : "No tiene permisos"}>
              <span className={!hasDeletePermission ? "opacity-50 cursor-not-allowed" : ""}>
                <Button
                  isIconOnly
                  variant="light"
                  color="danger"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); hasDeletePermission ? handleOpenConfirmationModal(usuario.nom_rol, usuario.id_rol) : null; }}
                  isDisabled={!hasDeletePermission}
                >
                  <FaTrash size={16} />
                </Button>
              </span>
            </Tooltip>
          </div>
        );
      default:
        return usuario[columnKey];
    }
  }, [hasEditPermission, hasDeletePermission]);

  return (
    <div className="w-full">

      <Table
        aria-label="Tabla de roles"
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
              {filteredUsuarios.length} roles
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
            <span className="text-small text-default-400 w-[10%]"></span>
          </div>
        }
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.align || "start"}
              allowsSorting={column.sortable}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          items={currentUsuarios}
          emptyContent={"No se encontraron roles"}
          isLoading={isLoading}
          loadingContent={<Spinner label="Cargando..." />}
        >
          {(item) => (
            <TableRow key={item.id_rol}>
              {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Modals */}
      {isConfirmationModalOpen && (
        <ConfirmationModal
          message={`¿Estás seguro que deseas eliminar "${selectedRow}"?`}
          onClose={handleCloseConfirmationModal}
          onConfirm={handleConfirmDelete}
        />
      )}

      {activeEdit && (
        <RolesForm
          modalTitle={'Editar Rol'}
          onClose={handleCloseModal}
          initialData={initialData}
          onSuccess={handleUpdateRolLocal}
        />
      )}
    </div>
  );
}