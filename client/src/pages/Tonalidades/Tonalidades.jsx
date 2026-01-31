import { useState, useEffect } from "react";
import TonalidadesForm from "./TonalidadesForm";
import { FaPlus } from "react-icons/fa";
import BarraSearch from "@/components/Search/Search";
import { ShowTonalidades } from "./ShowTonalidades";
import { usePermisos } from '@/routes';
import { getTonalidades } from "@/services/tonalidad.services";
import { ActionButton } from "@/components/Buttons/Buttons";

function Tonalidades({
    tonalidadesData = null,
    onAdd = null,
    onUpdate = null,
    onDelete = null,
    skipApiCall = false
}) {
    const [activeAdd, setModalOpen] = useState(false);
    const handleModalAdd = () => setModalOpen(!activeAdd);

    const { hasCreatePermission } = usePermisos();
    const [searchTerm, setSearchTerm] = useState("");

    const [tonalidades, setTonalidades] = useState(tonalidadesData || []);

    useEffect(() => {
        if (!skipApiCall && !tonalidadesData) {
            const fetchTonalidades = async () => {
                const data = await getTonalidades();
                setTonalidades(data || []);
            };
            fetchTonalidades();
        } else if (tonalidadesData) {
            setTonalidades(tonalidadesData);
        }
    }, [skipApiCall, tonalidadesData]);

    const handleAddTonalidad = (nuevaTonalidad) => {
        if (onAdd) {
            onAdd(nuevaTonalidad);
        } else {
            setTonalidades(prev => [nuevaTonalidad, ...prev]);
        }
    };

    const handleSearchChange = (e) => setSearchTerm(e.target.value);
    const handleClearSearch = () => setSearchTerm("");

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <BarraSearch
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Buscar tonalidad..."
                    isClearable={true}
                    onClear={handleClearSearch}
                    className="h-10 text-sm w-full md:w-72 dark:bg-gray-800 dark:text-white"
                />
                <ActionButton
                    color="primary"
                    endContent={<FaPlus size={18} />}
                    onClick={handleModalAdd}
                    disabled={!hasCreatePermission}
                    className={`h-10 px-4 font-semibold rounded-lg border-0 shadow-none 
            bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors 
            dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-200 
            ${!hasCreatePermission ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    Agregar tonalidad
                </ActionButton>
            </div>
            <ShowTonalidades searchTerm={searchTerm} tonalidades={tonalidades} setTonalidades={setTonalidades} onUpdate={onUpdate} onDelete={onDelete} />
            <TonalidadesForm
                modalTitle={'Nueva tonalidad'}
                isVisible={activeAdd}
                onClose={handleModalAdd}
                onAddTonalidad={handleAddTonalidad}
            />
        </div>
    );
}

export default Tonalidades;
