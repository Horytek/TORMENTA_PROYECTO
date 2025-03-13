import { useState, useEffect } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import { Toaster } from "react-hot-toast";
import { FaPlus } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
import { Button } from "@nextui-org/button";
import TablaModulos from '@/pages/Modulos/ComponentsModulos/TablaModulos';
import AddModuloModal from './ComponentsModulos/AddModulo';
import useGetModulos from "./data/getModulos";

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
            <Breadcrumb
                paths={[
                    { name: 'Inicio', href: '/inicio' },
                    { name: 'Módulos', href: '/configuracion/modulos' },
                ]}
            />
            <hr className="mb-4" />
            <h1 className="text-4xl font-extrabold">Módulos y submódulos</h1>
            <div className="flex items-center justify-between mt-5 mb-4">
                <div id="barcode-scanner" hidden style={{ width: '100%', height: '400px' }}></div>
                <h6 className="font-bold">Lista de Modulos</h6>
                <div className="relative w-2/4">
                    <div className="absolute inset-y-0 start-0 top-0 flex items-center ps-3.5 pointer-events-none">
                        <IoIosSearch className="w-4 h-4 text-gray-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="Ingrese nombre del módulo"
                        className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full ps-10 p-2.5"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>
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