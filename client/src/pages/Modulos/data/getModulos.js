import { useState, useEffect, useCallback } from 'react';
import axios from "@/api/axios";

const useGetModulos = () => {
    const [modulos, setModulos] = useState([]);
    const [submodulos, setSubmodulos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchModulos = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.get('/modulos/');
            
            if (response.data && response.data.success) {
                setModulos(response.data.data.modulos || []);
                setSubmodulos(response.data.data.submodulos || []);
            } else {
                setError(response.data?.message || 'Error al obtener los módulos');
                // Provide empty arrays as fallback
                setModulos([]);
                setSubmodulos([]);
            }
        } catch (error) {
            console.error('Error al cargar módulos');
            setError(error.response?.data?.message || error.message || 'Error al cargar los módulos');
            // Provide empty arrays as fallback
            setModulos([]);
            setSubmodulos([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const getSubmodulosByModuloId = useCallback((idModulo) => {
        return submodulos.filter(submodulo => submodulo.id_modulo === idModulo);
    }, [submodulos]);

    useEffect(() => {
        fetchModulos();
    }, [fetchModulos]);

    const refreshModulos = () => {
        fetchModulos();
    };

    return {
        modulos,
        submodulos,
        loading,
        error,
        getSubmodulosByModuloId,
        refreshModulos
    };
};

export default useGetModulos;