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
  ScrollShadow
} from "@heroui/react";
import { MdEdit } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { getRoles, deleteRol, getRol, addRol, updateRol } from '@/services/rol.services';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import UsuariosForm from './UsuariosForm';
import { usePermisos } from '@/routes';

export function ShowUsuarios({ searchTerm }) {
  // Estados de listado de usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const usuariosPerPage = 10;

  useEffect(() => {
    getUsers();
  }, []);

  // Obtener usuarios mediante API
  const getUsers = async () => {
    const data = await getRoles();
    // Excluir el rol "administrador"
    const filteredRoles = data.filter((rol) => rol.nom_rol.toLowerCase() !== "administrador");
    setUsuarios(filteredRoles);
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
  const [activeAdd, setActiveAdd] = useState(false);

  const handleModalAdd = () => {
    setActiveAdd(true);
  };
  const handleCloseAddModal = () => {
    setActiveAdd(false);
  };

  // Agregar rol al array local
  const handleAddRolLocal = async (data) => {
    const result = await addRol(data);
    if (result && result.id) {
      setUsuarios(prev => [{ ...data, id_rol: result.id, estado_rol: data.estado_rol === 1 ? "Activo" : "Inactivo" }, ...prev]);
      setActiveAdd(false);
    }
  };

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
    }
  };

  const { hasEditPermission, hasDeletePermission } = usePermisos();

  const renderCell = useCallback((usuario, columnKey) => {
    switch (columnKey) {
      case "id":
        return usuario.id_rol;
      case "rol":
        return usuario.nom_rol;
      case "estado":
        return (
          <span className={`
            inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-[13px] font-semibold
            ${usuario.estado_rol === 'Inactivo'
              ? "bg-rose-100 text-rose-700 border border-rose-200"
              : "bg-emerald-100 text-emerald-700 border-emerald-200"}
          `}>
            {usuario.estado_rol === 'Inactivo' ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {usuario.estado_rol}
          </span>
        );
      case "acciones":
        return (
          <div className="flex justify-center items-center gap-2">
            <Tooltip content={hasEditPermission ? "Editar" : "No tiene permisos para editar"}>
              <Button
                isIconOnly
                variant="light"
                color={hasEditPermission ? "warning" : "default"}
                onClick={() => hasEditPermission ? handleModalEdit(usuario.id_rol) : null}
                className={hasEditPermission ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
              >
                <MdEdit />
              </Button>
            </Tooltip>
            <Tooltip content={hasDeletePermission ? "Eliminar" : "No tiene permisos para eliminar"}>
              <Button
                isIconOnly
                variant="light"
                color={hasDeletePermission ? "danger" : "default"}
                onClick={() => hasDeletePermission ? handleOpenConfirmationModal(usuario.nom_rol, usuario.id_rol) : null}
                className={hasDeletePermission ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
              >
                <FaTrash />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return usuario[columnKey];
    }
  }, [hasEditPermission, hasDeletePermission]);

  return (
  <>
    {/* Botón para agregar rol */}


    {/* Modals */}
    {isConfirmationModalOpen && (
      <ConfirmationModal
        message={`¿Estás seguro que deseas eliminar "${selectedRow}"?`}
        onClose={handleCloseConfirmationModal}
        onConfirm={handleConfirmDelete}
      />
    )}

    {activeEdit && (
      <UsuariosForm
        modalTitle={'Editar Rol'}
        onClose={handleCloseModal}
        initialData={initialData}
        onSuccess={handleUpdateRolLocal}
      />
    )}

    {activeAdd && (
      <UsuariosForm
        modalTitle={'Nuevo Rol'}
        onClose={handleCloseAddModal}
        onSuccess={handleAddRolLocal}
      />
    )}

    {/* Tabla de roles */}
    <div className="bg-white/90 border border-blue-100 rounded-2xl shadow-sm p-0">
      <div className="p-4 bg-white rounded-2xl">
        <ScrollShadow hideScrollBar className="rounded-2xl">
          <table className="min-w-full border-collapse rounded-2xl overflow-hidden text-[13px]">
            <thead>
              <tr className="bg-blue-50 text-blue-900 text-[13px] font-bold">
                <th className="py-2 px-2 text-left">ID</th>
                <th className="py-2 px-2 text-left">ROL</th>
                <th className="py-2 px-2 text-center">ESTADO</th>
                <th className="py-2 px-2 text-center w-32">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {currentUsuarios.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">Sin roles para mostrar</td>
                </tr>
              ) : (
                currentUsuarios.map((usuario, idx) => (
                  <tr
                    key={usuario.id_rol}
                    className={`transition-colors duration-150 ${
                      idx % 2 === 0 ? "bg-white" : "bg-blue-50/40"
                    } hover:bg-blue-100/60`}
                  >
                    {["id", "rol", "estado", "acciones"].map((columnKey) => (
                      <td
                        key={columnKey}
                        className={`py-1.5 px-2 ${columnKey === "estado" || columnKey === "acciones" ? "text-center" : ""}`}
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
        total={Math.ceil(filteredUsuarios.length / usuariosPerPage)}
        onChange={setCurrentPage}
        color="primary"
        size="sm"
      />
      <div />
    </div>
  </>
  );
}

export default ShowUsuarios;