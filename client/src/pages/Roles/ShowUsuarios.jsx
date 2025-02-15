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
  Button
} from "@nextui-org/react";
import { MdEdit } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { getRoles, deleteRol, getRol } from '@/services/rol.services';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import UsuariosForm from './UsuariosForm';

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
        const data = await getRoles();
        setUsuarios(data);
    };

    // Filtrar usuarios
    const filteredUsuarios = usuarios.filter(usuario =>
        usuario.nom_rol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Usuarios a mostrar en la página actual
    const indexOfLastUsuario = currentPage * usuariosPerPage;
    const indexOfFirstUsuario = indexOfLastUsuario - usuariosPerPage;
    const currentUsuarios = filteredUsuarios.slice(indexOfFirstUsuario, indexOfLastUsuario);

    // Eliminar usuario mediante API
    const deleteUser = async (id) => {
        await deleteRol(id);
        getUsers();
    };

    // Estado de Modal de Edición de Producto
    const [activeEdit, setActiveEdit] = useState(false);
    const [initialData, setInitialData] = useState(null); // Datos iniciales del usuario a editar

    const handleModalEdit = async (id_usuario) => {
        const data = await getRol(id_usuario);
        if (data && data[0]) {
            setInitialData({
                id_rol: parseInt(id_usuario),
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
            case "id":
                return usuario.id_rol;
            case "rol":
                return usuario.nom_rol;
            case "estado":
                return (
                    <span className={
                        usuario.estado_rol === 'Inactivo'
                        ? "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-medium font-normal bg-red-100 text-red-600"
                        : "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-medium font-normal bg-green-200 text-green-700"
                    }>
                        {usuario.estado_rol}
                    </span>
                );
                case "acciones":
                    return (
                        <div className="flex justify-center items-center gap-2">
                            <Tooltip content="Editar">
                                <Button
                                    isIconOnly
                                    variant="light"
                                    color="warning"
                                    onClick={() => handleModalEdit(usuario.id_rol)}
                                >
                                    <MdEdit />
                                </Button>
                            </Tooltip>
                            <Tooltip content="Eliminar">
                                <Button
                                    isIconOnly
                                    variant="light"
                                    color="danger"
                                    onClick={() => handleOpenConfirmationModal(usuario.nom_rol, usuario.id_rol)}
                                >
                                    <FaTrash />
                                </Button>
                            </Tooltip>
                        </div>
                    );
                default:
                    return usuario[columnKey];
            }
    }, []);

    return (
        <div>
<Table
isStriped
    aria-label="Usuarios"
    className="min-w-full border-collapse"
>

                <TableHeader>
                    <TableColumn>ID</TableColumn>
                    <TableColumn>ROL</TableColumn>
                    <TableColumn>ESTADO</TableColumn>
                    <TableColumn className="w-32 text-center">ACCIONES</TableColumn>
                </TableHeader>
                <TableBody>
                    {currentUsuarios.map((usuario) => (
                        <TableRow key={usuario.id_rol}>
                            {["id", "rol", "estado", "acciones"].map((columnKey) => (
                                <TableCell key={columnKey}>{renderCell(usuario, columnKey)}</TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Paginación */}
            <div className="flex justify-end mt-4">
                <Pagination
                    showControls
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredUsuarios.length / usuariosPerPage)}
                    onPageChange={setCurrentPage}
                />
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
                    modalTitle={'Editar Rol'} 
                    onClose={handleCloseModal}
                    initialData={initialData} 
                />
            )}
        </div>
    );
}

export default ShowUsuarios;