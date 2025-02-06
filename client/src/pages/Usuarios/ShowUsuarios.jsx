import { useEffect, useState } from 'react';
import Pagination from '@/components/Pagination/Pagination';
import UsuariosForm from './UsuariosForm';
import { MdEdit } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { getUsuarios, deleteUsuario, getUsuario } from '@/services/usuario.services';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { VscDebugDisconnect } from "react-icons/vsc";
import { PiPlugsConnected } from "react-icons/pi";
import {Tooltip} from "@nextui-org/tooltip";
import {Avatar, AvatarGroup, AvatarIcon} from "@nextui-org/avatar";

export function ShowUsuarios({ searchTerm }) {
  
    // Estados de listado de usuarios
    const [usuarios, setUsuarios] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [showPassword, setShowPassword] = useState({}); // Estado para manejar la visibilidad de contraseñas
    const usuariosPerPage = 10;

    useEffect(() => {
        getUsers();
    }, []);

    //const estado_token = localStorage.getItem("estado_token");

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

    return (
        <div>
            <div className="overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm divide-gray-200 rounded-lg table-auto">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-sm font-bold text-center text-gray-500 uppercase">ROL</th>
                            <th className="px-6 py-3 text-sm font-bold text-center text-gray-500 uppercase">USUARIO</th>
                            <th className="px-6 py-3 text-sm font-bold text-center text-gray-500 uppercase">CONTRASEÑA</th>
                            <th className="px-6 py-3 text-sm font-bold text-center text-gray-500 uppercase">ESTADO</th>
                            <th className="px-6 py-3 text-sm font-bold text-center text-gray-500 uppercase">ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-gray-200">
                        {currentUsuarios.map((usuario) => (
                            <tr className='hover:bg-gray-100' key={usuario.id_usuario} data-product={usuario.id_usuario}>
                                <td className='py-2 text-center'>{usuario.nom_rol}</td>
                                <td className='py-2 text-center flex items-center justify-center gap-x-2'>
    <Tooltip content={usuario.estado_token == 1  ? "Conectado" : "Desconectado"}>
    <div className="flex items-center justify-center gap-x-2">
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
</td>


                                <td className='py-2 text-center'>
                                    <div className="flex items-center justify-center">
                                        
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
                                </td>
                                <td className='py-2 text-center'>
                                    <span className={
                                        usuario.estado_usuario === 'Inactivo'
                                        ? "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-medium font-normal bg-red-100 text-red-600"
                                        : "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-medium font-normal bg-green-200 text-green-700"
                                    }>
                                        {usuario.estado_usuario}
                                    </span>
                                </td>
                                <td className='py-4 text-center'>
                                    <div className="flex items-center justify-center">
                                        <button className="px-2 py-1 text-xl text-yellow-400" onClick={() => handleModalEdit(usuario.id_usuario)}>
                                            <MdEdit />
                                        </button>
                                        <button className="px-2 py-1 text-red-500" onClick={() => handleOpenConfirmationModal(usuario.usua, usuario.id_usuario)}>
                                            <FaTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            <div className="flex justify-end mt-4">
                <div className="flex">
                    <Pagination
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