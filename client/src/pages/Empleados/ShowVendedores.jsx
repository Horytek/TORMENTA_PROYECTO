import { useEffect, useState } from 'react';
import Pagination from '@/components/Pagination/Pagination';
import VendedoresForm from './VendedoresForm';
import { MdEdit } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { getVendedores, deactivateVendedor, getVendedor } from '@/services/vendedor.services';
import ConfirmationModal from '@/components/Modals/ConfirmationModal';
import { Tooltip } from "@nextui-org/tooltip";
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { VscDebugDisconnect } from "react-icons/vsc";
import { PiPlugsConnected } from "react-icons/pi";
import { Avatar, AvatarGroup, AvatarIcon } from "@nextui-org/avatar";

export function ShowVendedores({ searchTerm }) {
    const [vendedores, setVendedores] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [showPassword, setShowPassword] = useState({});
    const vendedoresPerPage = 10;
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [selectedDni, setSelectedDni] = useState(null);
    
    useEffect(() => {
        getUsers();
    }, []);

    //const estado_token = localStorage.getItem("estado_token");

    // Obtener usuarios mediante API
    const getUsers = async () => {
        const data = await getVendedores();
        setVendedores(data);
    };

    const filteredVendedores = vendedores.filter(vendedor =>
        vendedor.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastVendedor = currentPage * vendedoresPerPage;
    const indexOfFirstVendedor = indexOfLastVendedor - vendedoresPerPage;
    const currentVendedores = filteredVendedores.slice(indexOfFirstVendedor, indexOfLastVendedor);

    const deleteHandler = async () => {
        const dni_ver = localStorage.getItem("dni");
        //console.log("Enviando DNI a API:", dni_ver); // <-- Verifica el valor antes de llamar a la API
        if (!dni_ver) {
            console.error("Error: DNI no definido en deleteHandler.");
            return;
        }
        await deactivateVendedor(dni_ver);
        getUsers();
    };
    


    const handleOpenConfirmationModal = (row, dni) => {
        localStorage.setItem("dni", dni);
        //console.log("DNI seleccionado para eliminación:", dni); // <-- Verifica que `dni` tenga un valor
        setSelectedRow(row);
        setSelectedDni(dni);
        setIsConfirmationModalOpen(true);
    };
    

    const handleCloseConfirmationModal = () => {
        setIsConfirmationModalOpen(false);
        setSelectedRow(null);
    };

    const handleConfirmDelete = () => {
        //console.log("DNI enviado para eliminación:", selectedDni); // <-- Verifica el valor antes de eliminar
        if (!selectedDni) {
            console.error("Error: No hay DNI seleccionado para eliminar.");
            return;
        }
        deleteHandler();
        handleCloseConfirmationModal();
    };
    

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [initialData, setInitialData] = useState(null);

    const handleEditModal = async (dni) => {
        localStorage.setItem("dni_r", dni);
        try {
            const data = await getVendedor(dni); 
    
            console.log("Respuesta de getVendedor:", data); // Para depuración
    
            if (!data || data.length === 0) {
                console.error("Error: No se encontró el vendedor o la respuesta es inválida.");
                return;
            }
    
            setInitialData(data[0]);  // Corregido: usar 'data[0]' en lugar de 'response.data[0]'
            setIsEditModalOpen(true);
        } catch (error) {
            console.error("Error al obtener vendedor:", error);
        }
    };
    

    const handleCloseModal = () => {
        setIsEditModalOpen(false);
        setInitialData(null);
    };

    return (
        <div>
            <div className="overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm divide-gray-200 rounded-lg table-auto">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-sm font-bold text-center text-gray-500 uppercase">DNI</th>
                            <th className="px-6 py-3 text-sm font-bold text-center text-gray-500 uppercase">Usuario</th>
                            <th className="px-6 py-3 text-sm font-bold text-center text-gray-500 uppercase">Nombre</th>
                            <th className="px-6 py-3 text-sm font-bold text-center text-gray-500 uppercase">Teléfono</th>
                            <th className="px-6 py-3 text-sm font-bold text-center text-gray-500 uppercase">Estado</th>
                            <th className="px-6 py-3 text-sm font-bold text-center text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-gray-200">
                        {currentVendedores.map((vendedor) => (
                            <tr className='hover:bg-gray-100' key={vendedor.dni}>
                                <td className='py-2 text-center'>{vendedor.dni}</td>
                                <td className='py-2 text-center'>{vendedor.usua}</td>
                                <td className='py-2 text-center'>{vendedor.nombre}</td>
                                <td className='py-2 text-center'>{vendedor.telefono}</td>
                                <td className='py-2 text-center'>
                                    <span className={
                                        vendedor.estado_vendedor === 'Inactivo'
                                            ? "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-medium font-normal bg-red-100 text-red-600"
                                            : "inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-medium font-normal bg-green-200 text-green-700"
                                    }>
                                        {vendedor.estado_vendedor}
                                    </span>
                                </td>
                                <td className='py-4 text-center'>
                                    <div className="flex items-center justify-center">
                                        <button className="px-2 py-1 text-xl text-yellow-400" onClick={() => handleEditModal(vendedor.dni)}>
                                            <MdEdit />
                                        </button>
                                        <button className="px-2 py-1 text-red-500" onClick={() => handleOpenConfirmationModal(vendedor.nombre, vendedor.dni)}>
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
                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredVendedores.length / vendedoresPerPage)}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Modal de Confirmación */}
            {isConfirmationModalOpen && (
                <ConfirmationModal
                    message={`¿Estás seguro que deseas eliminar "${selectedRow}"?`}
                    onClose={handleCloseConfirmationModal}
                    onConfirm={handleConfirmDelete}
                />
            )}

            {/* Modal de Edición */}
            {isEditModalOpen && (
                <VendedoresForm
                    modalTitle={'Editar Vendedor'} 
                    onClose={handleCloseModal}
                    initialData={initialData} 
                />
            )}
        </div>
    );
}

export default ShowVendedores;