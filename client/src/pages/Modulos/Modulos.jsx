import { useState } from 'react';
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import { Button } from "@heroui/button";
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
        <div>
            <Toaster />
            
            <hr className="mb-3" />
            <h1 className="text-4xl font-extrabold">Módulos y submódulos</h1>
            <div className="flex items-center justify-between mt-5 mb-4">
                <div id="barcode-scanner" hidden style={{ width: '100%', height: '400px' }}></div>
                <h6 className="font-bold">Lista de Módulos</h6>
                <BarraSearch
                    placeholder="Ingrese nombre del módulo"
                    isClearable={true}
                    className="h-9 text-sm w-2/4"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
                <div className="flex gap-5">
                    <Button
                        color="primary"
                        endContent={<FaPlus style={{ fontSize: '25px' }} />}
                        onClick={handleModalAdd}
                    >
                        Agregar módulo
                    </Button>
                </div>
            </div>
            <div>
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