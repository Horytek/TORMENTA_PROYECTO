import { useState } from 'react';
import BarraSearch from "@/components/Search/Search";
import { Tooltip } from '@heroui/react';
import { FaPlus } from "react-icons/fa";
import ShowRoles from '@/pages/Roles/ShowRoles';
import { usePermisos } from '@/routes';
import RolesForm from '../RolesForm';
import { ActionButton } from "@/components/Buttons/Buttons";

export default function TablaRoles({ searchTerm: initialSearchTerm, externalData, skipApiCall = false }) {
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');
    const [activeAdd, setModalOpen] = useState(false);
    const handleModalAdd = () => setModalOpen(!activeAdd);
    const handleSearchChange = (e) => setSearchTerm(e.target.value);
    const { hasCreatePermission } = usePermisos();

    return (
        <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800">
                <BarraSearch
                    placeholder="Buscar rol..."
                    isClearable={true}
                    className="w-full sm:w-80"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />

                <Tooltip content={hasCreatePermission ? "Agregar rol" : "No tiene permisos para agregar roles"}>
                    <div className={!hasCreatePermission ? "cursor-not-allowed opacity-50" : ""}>
                        <ActionButton
                            color="blue"
                            icon={<FaPlus size={16} />}
                            onClick={hasCreatePermission ? handleModalAdd : undefined}
                            disabled={!hasCreatePermission}
                            className="flex-1 sm:flex-none"
                        >
                            Nuevo rol
                        </ActionButton>
                    </div>
                </Tooltip>
            </div>

            <ShowRoles searchTerm={searchTerm} />

            {activeAdd && (
                <RolesForm
                    modalTitle="Nuevo Rol"
                    onClose={handleModalAdd}
                />
            )}
        </div>
    );
}