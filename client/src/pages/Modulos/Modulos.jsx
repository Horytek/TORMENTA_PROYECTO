import { useState } from 'react';
import { FaPlus } from "react-icons/fa";
import { Button } from '@heroui/react';
import TablaModulos from '@/pages/Modulos/ComponentsModulos/TablaModulos';
import AddModuloModal from './ComponentsModulos/AddModulo';
import useGetModulos from "./data/getModulos";
import BarraSearch from "@/components/Search/Search";

function Modulos() {
    const [activeAdd, setModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Get all data and functions from the hook
    const { modulos, submodulos, loading, error, getSubmodulosByModuloId, refreshModulos } = useGetModulos();

    const handleModalAdd = () => {
        setModalOpen(!activeAdd);
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    return (
        <div className="w-full my-4">

            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">Módulos y Submódulos</h1>
                    <p className="text-sm text-gray-500 mt-1">Gestiona la estructura de navegación del sistema</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <BarraSearch
                        placeholder="Buscar módulo..."
                        isClearable={true}
                        className="w-full md:w-64"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                    <Button
                        color="primary"
                        endContent={<FaPlus />}
                        onPress={handleModalAdd}
                        className="font-semibold"
                    >
                        Nuevo Módulo
                    </Button>
                </div>
            </div>

            <TablaModulos
                modulos={modulos}
                submodulos={submodulos}
                loading={loading}
                error={error}
                searchTerm={searchTerm}
                getSubmodulosByModuloId={getSubmodulosByModuloId}
                refreshModulos={refreshModulos}
            />

            <AddModuloModal
                open={activeAdd}
                onClose={handleModalAdd}
                onModuloCreated={refreshModulos}
                refetch={refreshModulos}
            />
        </div>
    );
}

export default Modulos;