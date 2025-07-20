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
  ScrollShadow
} from "@heroui/react";
import UsuariosForm from './UsuariosForm';
import { MdEdit } from "react-icons/md";
import { FaTrash, FaEye, FaEyeSlash } from "react-icons/fa";
import { getUsuarios, deleteUsuario, getUsuario } from '@/services/usuario.services';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import { VscDebugDisconnect } from "react-icons/vsc";
import { PiPlugsConnected } from "react-icons/pi";
import { usePermisos } from '@/routes';

export function ShowUsuarios({ searchTerm, usuarios, addUsuario, updateUsuarioLocal, removeUsuario }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [showPassword, setShowPassword] = useState({});
    const usuariosPerPage = 10;

    // Filtrar usuarios localmente
    const filteredUsuarios = usuarios.filter(usuario =>
        usuario.usua.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
        updateUsuarioLocal(id_usuario, updatedData);
        setActiveEdit(false);
        setInitialData(null);
    };

    const handleSuccessAdd = (nuevoUsuario) => {
        addUsuario(nuevoUsuario);
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

    const renderCell = useCallback((usuario, columnKey) => {
        switch (columnKey) {
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
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-rose-300 bg-rose-50"
                        }
                    `}
                >
                    {usuario.estado_token === 1 ? (
                        <PiPlugsConnected className="text-emerald-500 text-xl" />
                    ) : (
                        <VscDebugDisconnect className="text-rose-500 text-xl" />
                    )}
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold text-blue-900 text-[15px] leading-tight">{usuario.usua}</span>
                    <span className={`text-xs font-medium ${usuario.estado_token === 1 ? "text-emerald-600" : "text-rose-600"} flex items-center gap-1`}>
                        <span className={`inline-block w-2 h-2 rounded-full ${usuario.estado_token === 1 ? "bg-emerald-400" : "bg-rose-400"}`}></span>
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
                        >
                            <span className="mr-2">
                            {showPassword[usuario.id_usuario] ? usuario.contra : '••••••••'}
                            </span>
                            <span className='text-gray-500'>
                                {showPassword[usuario.id_usuario] ?  <FaEyeSlash /> : <FaEye />}
                            </span>
                        </button>
                    </div>
                );
                    case "estado":
                        return (
                        <span className={`
                            inline-flex items-center gap-x-1 py-0.5 px-2 rounded-full text-[12px] font-semibold
                            ${usuario.estado_usuario === 'Inactivo'
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : "bg-green-100 text-green-700 border border-green-200"}
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
                    <div className="flex items-center justify-center gap-2">
                        <Tooltip content={hasEditPermission ? "Editar" : "No tiene permisos para editar"}>
                            <Button 
                                isIconOnly 
                                variant="light" 
                                color={hasEditPermission ? "warning" : "default"}
                                onClick={() => hasEditPermission ? handleModalEdit(usuario.id_usuario) : null}
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
                                onClick={() => hasDeletePermission ? handleOpenConfirmationModal(usuario.usua, usuario.id_usuario) : null}
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
    }, [showPassword, hasEditPermission, hasDeletePermission]);

    return (
  <>
    <div className="bg-white/90 rounded-2xl shadow border border-blue-100 p-0">
      <ScrollShadow hideScrollBar>
        <table className="min-w-full border-collapse rounded-2xl overflow-hidden text-[13px]">
          <thead>
            <tr className="bg-blue-50 text-blue-900 text-[13px] font-bold">
              <th className="py-2 px-2 text-left">Rol</th>
              <th className="py-2 px-2 text-left">Usuario</th>
              <th className="py-2 px-2 text-left">Contraseña</th>
              <th className="py-2 px-2 text-center">Estado</th>
              <th className="py-2 px-2 text-center w-32">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentUsuarios.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">Sin usuarios para mostrar</td>
              </tr>
            ) : (
              currentUsuarios.map((usuario, idx) => (
                <tr
                  key={usuario.id_usuario}
                  className={`transition-colors duration-150 ${
                    idx % 2 === 0 ? "bg-white" : "bg-blue-50/40"
                  } hover:bg-blue-100/60`}
                >
                  {["rol", "usuario", "contraseña", "estado", "acciones"].map((columnKey) => (
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
    <div className="flex justify-between items-center mt-2 px-4 pb-2">
      <Pagination
        showControls
        page={currentPage}
        total={Math.ceil(filteredUsuarios.length / usuariosPerPage)}
        onChange={(page) => setCurrentPage(page)}
        color="primary"
        size="sm"
      />
      <div />
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
  </>
);
}

export default ShowUsuarios;