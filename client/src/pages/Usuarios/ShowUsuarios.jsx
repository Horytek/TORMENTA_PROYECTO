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
  Chip
} from "@nextui-org/react";
import UsuariosForm from './UsuariosForm';
import { MdEdit } from "react-icons/md";
import { FaTrash, FaEye, FaEyeSlash } from "react-icons/fa";
import { getUsuarios, deleteUsuario, getUsuario } from '@/services/usuario.services';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import { VscDebugDisconnect } from "react-icons/vsc";
import { PiPlugsConnected } from "react-icons/pi";

export function ShowUsuarios({ searchTerm }) {
  
    // Estados de listado de usuarios
    const [usuarios, setUsuarios] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [showPassword, setShowPassword] = useState({}); // Estado para manejar la visibilidad de contraseñas
    const usuariosPerPage = 10;
    

    useEffect(() => {
        getUsers();
    }, []);

    // Obtener usuarios mediante API
    const getUsers = async () => {
        const data = await getUsuarios();
        setUsuarios(data);
    };

    // Filtrar usuarios
    const filteredUsuarios = usuarios.filter(usuario =>
        usuario.usua.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Usuarios a mostrar en la página actual
    const indexOfLastUsuario = currentPage * usuariosPerPage;
    const indexOfFirstUsuario = indexOfLastUsuario - usuariosPerPage;
    const currentUsuarios = filteredUsuarios.slice(indexOfFirstUsuario, indexOfLastUsuario);

    // Eliminar usuario mediante API
    const deleteUser = async (id) => {
        await deleteUsuario(id);
        getUsers();
    };

    // Estado de Modal de Edición de Producto
    const [activeEdit, setActiveEdit] = useState(false);
    const [initialData, setInitialData] = useState(null); // Datos iniciales del usuario a editar

    const handleModalEdit = async (id_usuario) => {
        const data = await getUsuario(id_usuario);
        if (data && data[0]) {
            setInitialData({
                id_usuario: parseInt(id_usuario),
                data: data[0]
            });
            setActiveEdit(true); // Abre el modal solo si los datos están disponibles
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

    // Función para manejar la acción de confirmación de eliminación de usuario
    const handleConfirmDelete = () => {
        deleteUser(selectedId); // Eliminación de usuario mediante api
        handleCloseConfirmationModal();
    };

    const handleCloseModal = () => {
        setActiveEdit(false);
        setInitialData(null);
    };

    // Función para alternar la visibilidad de la contraseña
    const togglePasswordVisibility = (id_usuario) => {
        setShowPassword(prevState => ({
            ...prevState,
            [id_usuario]: !prevState[id_usuario]
        }));
    };

    const renderCell = useCallback((usuario, columnKey) => {
        switch (columnKey) {
            case "rol":
                return usuario.nom_rol;
            case "usuario":
                return (
                    <Tooltip content={usuario.estado_token == 1 ? "Conectado" : "Desconectado"}>
                        <div className="flex gap-x-2">
                            <span className="font-medium text-gray-700">{usuario.usua}</span>
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 p-1 transition-all duration-200 ease-in-out 
                                ${usuario.estado_token === 1 
                                    ? 'border-success-300 bg-success-100' // Verde claro para conectado
                                    : 'border-danger-300 bg-danger-100'   // Rojo claro para desconectado
                                }`}>
                                {usuario.estado_token === 1 
                                    ? <PiPlugsConnected className="text-success-600 text-lg transition-all duration-300 ease-in-out transform hover:scale-105" />
                                    : <VscDebugDisconnect className="text-danger-600 text-lg transition-all duration-300 ease-in-out transform hover:scale-105" />
                                }
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
                    <Chip className="capitalize" color={usuario.estado_usuario === 'Inactivo' ? "danger" : "success"} size="lg" variant="flat">
                        {usuario.estado_usuario}
                    </Chip>
                );
            case "acciones":
                return (
                    <div className="flex items-center justify-center gap-2">
                        <Tooltip content="Editar">
                            <Button isIconOnly variant="light" color="warning" onClick={() => handleModalEdit(usuario.id_usuario)}>
                                <MdEdit />
                            </Button>
                        </Tooltip>
                        <Tooltip content="Eliminar">
                            <Button isIconOnly variant="light" color="danger" onClick={() => handleOpenConfirmationModal(usuario.usua, usuario.id_usuario)}>
                                <FaTrash />
                            </Button>
                        </Tooltip>
                    </div>
                );
            default:
                return usuario[columnKey];
        }
    }, [showPassword]);

    return (
        <div>
            <div className="overflow-x-auto shadow-md sm:rounded-lg">
                <Table aria-label="Usuarios" className="min-w-full border-collapse">
                    <TableHeader>
                        <TableColumn>ROL</TableColumn>
                        <TableColumn>USUARIO</TableColumn>
                        <TableColumn>CONTRASEÑA</TableColumn>
                        <TableColumn>ESTADO</TableColumn>
                        <TableColumn className="w-32 text-center">ACCIONES</TableColumn>
                    </TableHeader>
                    <TableBody>
                        {currentUsuarios.map((usuario) => (
                            <TableRow key={usuario.id_usuario}>
                                {["rol", "usuario", "contraseña", "estado", "acciones"].map((columnKey) => (
                                    <TableCell key={columnKey}>{renderCell(usuario, columnKey)}</TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Paginación */}
            <div className="flex justify-end mt-4">
                <div className="flex">
                    <Pagination
                        showControls
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredUsuarios.length / usuariosPerPage)}
                        onPageChange={setCurrentPage}
                    />
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

            {/* Modal de Editar Producto */}
            {activeEdit && (
                <UsuariosForm 
                    modalTitle={'Editar Usuario'} 
                    onClose={handleCloseModal}
                    initialData={initialData} 
                />
            )}
        </div>
    );
}

export default ShowUsuarios;