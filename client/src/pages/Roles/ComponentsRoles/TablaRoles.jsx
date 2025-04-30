import { useState } from 'react';
import BarraSearch from "@/components/Search/Search";
import { Tooltip } from "@nextui-org/tooltip";
import { Button } from "@nextui-org/button";
import { FaPlus } from "react-icons/fa";
import ShowUsuarios from '@/pages/Roles/ShowUsuarios';
import { usePermisos } from '@/routes';
import UsuariosForm from '../UsuariosForm'; // Asegúrate de importar el formulario

export default function TablaRoles({ searchTerm: initialSearchTerm }) {
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');
    const [activeAdd, setModalOpen] = useState(false);
    const handleModalAdd = () => setModalOpen(!activeAdd);
    const handleSearchChange = (e) => setSearchTerm(e.target.value);
    const { hasCreatePermission } = usePermisos();

    return (
        <div>
            <h1 className='text-4xl font-extrabold mb-2'>Gestión de roles</h1>
            <div className="flex items-center justify-between mt-2 mb-4">
                <h6 className="font-bold">Lista de Roles</h6>
                <BarraSearch
                    placeholder="Ingrese un rol"
                    isClearable={true}
                    className="h-9 text-sm w-2/4"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
                <div className="flex gap-5">
                    <Tooltip content={hasCreatePermission ? "Agregar rol" : "No tiene permisos para agregar roles"}>
                        <Button
                            color={hasCreatePermission ? "primary" : "default"}
                            endContent={<FaPlus style={{ fontSize: '25px' }} />}
                            onClick={() => hasCreatePermission ? handleModalAdd() : null}
                            className={hasCreatePermission ? "" : "opacity-50 cursor-not-allowed"}
                        >
                            Agregar rol
                        </Button>
                    </Tooltip>
                </div>
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