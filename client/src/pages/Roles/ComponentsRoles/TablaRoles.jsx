import { useState } from 'react';
import BarraSearch from "@/components/Search/Search";
import { Button, Tooltip } from '@heroui/react';
import { FaPlus } from "react-icons/fa";
import ShowUsuarios from '@/pages/Roles/ShowUsuarios';
import { usePermisos } from '@/routes';
import UsuariosForm from '../UsuariosForm'; // Asegúrate de importar el formulario

export default function TablaRoles({ searchTerm: initialSearchTerm, externalData, skipApiCall = false }) {
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');
    const [activeAdd, setModalOpen] = useState(false);
    const handleModalAdd = () => setModalOpen(!activeAdd);
    const handleSearchChange = (e) => setSearchTerm(e.target.value);
    const { hasCreatePermission } = usePermisos();

return (
    <div className="mx-2 md:mx-6 my-4">
        <h1 className='text-3xl font-extrabold mb-4 text-blue-900 tracking-tight'>Gestión de roles</h1>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h6 className="font-bold text-blue-700">Lista de Roles</h6>
            <BarraSearch
                placeholder="Ingrese un rol"
                isClearable={true}
                className="h-10 text-sm w-full md:w-2/4"
                value={searchTerm}
                onChange={handleSearchChange}
            />
            <Tooltip content={hasCreatePermission ? "Agregar rol" : "No tiene permisos para agregar roles"}>
                <Button
                    color={hasCreatePermission ? "primary" : "default"}
                    endContent={<FaPlus style={{ fontSize: '22px' }} />}
                    onClick={() => hasCreatePermission ? handleModalAdd() : null}
                    className={`h-10 px-5 font-semibold rounded-lg shadow-sm bg-blue-600 hover:bg-blue-700 text-white transition ${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Agregar rol
                </Button>
            </Tooltip>
        </div>
        <ShowUsuarios searchTerm={searchTerm} />
        {activeAdd && (
            <UsuariosForm
                modalTitle="Nuevo Rol"
                onClose={handleModalAdd}
            />
        )}
    </div>
);
}