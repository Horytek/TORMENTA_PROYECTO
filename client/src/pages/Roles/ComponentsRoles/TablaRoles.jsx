import { useState } from 'react';
import BarraSearch from "@/components/Search/Search";
import { Button, Tooltip } from '@heroui/react';
import { FaPlus } from "react-icons/fa";
import ShowUsuarios from '@/pages/Roles/ShowUsuarios';
import { usePermisos } from '@/routes';
import UsuariosForm from '../UsuariosForm'; 
import { ActionButton } from "@/components/Buttons/Buttons";

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
                <ActionButton
                    color="blue"
                    icon={<FaPlus className="w-4 h-4 text-blue-500" />}
                    onClick={handleModalAdd}
                    disabled={!hasCreatePermission}
                    size="sm"
                    className={`h-10 px-4 font-semibold rounded-lg border-0 shadow-none bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-200 ${!hasCreatePermission ? 'opacity-50 cursor-not-allowed' : ''}`}
                    style={{ boxShadow: "none", border: "none" }}
                >
                    Agregar rol
                </ActionButton>
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