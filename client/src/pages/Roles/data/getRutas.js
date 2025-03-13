import { useState, useEffect, useCallback } from 'react';
import axios from "@/api/axios";

const useGetRutas = () => {
    const [modulosConSubmodulos, setModulosConSubmodulos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedModulos, setExpandedModulos] = useState({});

    const fetchRutas = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.get('/permisos/');
            
            if (response.data && response.data.success) {
                setModulosConSubmodulos(response.data.data || []);
            } else {
                setError(response.data?.message || 'Error al obtener las rutas');
                setModulosConSubmodulos([]);
            }
        } catch (error) {
            console.error('Error al cargar rutas:', error);
            setError(error.response?.data?.message || error.message || 'Error al cargar las rutas');
            setModulosConSubmodulos([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Toggle expansion state for a specific module
    const toggleExpand = useCallback((moduleId) => {
        setExpandedModulos(prev => ({
            ...prev,
            [moduleId]: !prev[moduleId]
        }));
    }, []);

    // Expand all modules
    const expandAll = useCallback(() => {
        const allExpanded = {};
        modulosConSubmodulos.forEach(modulo => {
            if (modulo.expandible) {
                allExpanded[modulo.id] = true;
            }
        });
        setExpandedModulos(allExpanded);
    }, [modulosConSubmodulos]);

    // Collapse all modules
    const collapseAll = useCallback(() => {
        setExpandedModulos({});
    }, []);

    // Check if a module is expanded
    const isExpanded = useCallback((moduleId) => {
        return !!expandedModulos[moduleId];
    }, [expandedModulos]);

    useEffect(() => {
        fetchRutas();
    }, [fetchRutas]);

    return {
        modulosConSubmodulos,
        loading,
        error,
        expandedModulos,
        toggleExpand,
        expandAll,
        collapseAll,
        isExpanded,
        refreshRutas: fetchRutas
    };
};

export default useGetRutas;