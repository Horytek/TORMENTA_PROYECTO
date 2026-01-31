import { useState, useEffect } from "react";
import TallasForm from "./TallasForm";
import { FaPlus } from "react-icons/fa";
import BarraSearch from "@/components/Search/Search";
import { ShowTallas } from "./ShowTallas";
import { usePermisos } from '@/routes';
import { getTallas } from "@/services/talla.services";
import { ActionButton } from "@/components/Buttons/Buttons";

function Tallas({
    tallasData = null,
    onAdd = null,
    onUpdate = null,
    onDelete = null,
    skipApiCall = false
}) {
    const [activeAdd, setModalOpen] = useState(false);
    const handleModalAdd = () => setModalOpen(!activeAdd);

    const { hasCreatePermission } = usePermisos();
    const [searchTerm, setSearchTerm] = useState("");

    const [tallas, setTallas] = useState(tallasData || []);

    useEffect(() => {
        if (!skipApiCall && !tallasData) {
            const fetchTallas = async () => {
                const data = await getTallas();
                setTallas(data || []);
            };
            fetchTallas();
        } else if (tallasData) {
            setTallas(tallasData);
        }
    }, [skipApiCall, tallasData]);

    const handleAddTalla = (nuevaTalla) => {
        if (onAdd) {
            onAdd(nuevaTalla);
        } else {
            setTallas(prev => [nuevaTalla, ...prev]);
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
                    placeholder="Buscar talla..."
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
                    Agregar talla
                </ActionButton>
            </div>
            <ShowTallas searchTerm={searchTerm} tallas={tallas} setTallas={setTallas} onUpdate={onUpdate} onDelete={onDelete} />
            <TallasForm
                modalTitle={'Nueva talla'}
                isVisible={activeAdd}
                onClose={handleModalAdd}
                onAddTalla={handleAddTalla}
            />
        </div>
    );
}

export default Tallas;
