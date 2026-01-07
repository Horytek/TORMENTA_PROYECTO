import { useState } from 'react';
import { FaPlus, FaLayerGroup } from "react-icons/fa";
import { Button, Card, CardBody } from '@heroui/react';
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
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                        <FaLayerGroup size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                            Módulos y Submódulos
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                            Gestiona la estructura de navegación y organización del sistema
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <BarraSearch
                        placeholder="Buscar módulo..."
                        isClearable={true}
                        className="w-full sm:w-72"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                    <Button
                        color="primary"
                        endContent={<FaPlus size={14} />}
                        onPress={handleModalAdd}
                        className="font-semibold shadow-lg shadow-blue-500/30"
                        radius="full"
                    >
                        Nuevo Módulo
                    </Button>
                </div>
            </div>

            {/* Content Section */}
            <div className="grid grid-cols-1">
                <TablaModulos
                    modulos={modulos}
                    submodulos={submodulos}
                    loading={loading}
                    error={error}
                    searchTerm={searchTerm}
                    getSubmodulosByModuloId={getSubmodulosByModuloId}
                    refreshModulos={refreshModulos}
                />
            </div>

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