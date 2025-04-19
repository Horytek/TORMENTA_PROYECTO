import { useState, useEffect, useCallback } from 'react';
import axios from "@/api/axios";

const useGetRutas = () => {
    const [modulosConSubmodulos, setModulosConSubmodulos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedModulos, setExpandedModulos] = useState({});
    const [selectedRutas, setSelectedRutas] = useState({}); 

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

    const toggleExpand = useCallback((moduleId) => {
        setExpandedModulos(prev => ({
            ...prev,
            [moduleId]: !prev[moduleId]
        }));
    }, []);

    const expandAll = useCallback(() => {
        const allExpanded = {};
        modulosConSubmodulos.forEach(modulo => {
            if (modulo.expandible) {
                allExpanded[modulo.id] = true;
            }
        });
        setExpandedModulos(allExpanded);
    }, [modulosConSubmodulos]);

    const collapseAll = useCallback(() => {
        setExpandedModulos({});
    }, []);

    const addAll = useCallback(() => {
        const allSelected = {};
        
        modulosConSubmodulos.forEach(modulo => {
            allSelected[modulo.id] = true;
            
            if (modulo.submodulos && Array.isArray(modulo.submodulos)) {
                modulo.submodulos.forEach(submodulo => {
                    allSelected[submodulo.id] = true;
                });
            }
        });
        
        setSelectedRutas(allSelected);
    }, [modulosConSubmodulos]);

    const deleteAll = useCallback(() => {
        setSelectedRutas({});
    }, []);

    const isExpanded = useCallback((moduleId) => {
        return !!expandedModulos[moduleId];
    }, [expandedModulos]);
    
    const isSelected = useCallback((rutaId) => {
        return !!selectedRutas[rutaId];
    }, [selectedRutas]);
    
    const toggleSelection = useCallback((rutaId) => {
        setSelectedRutas(prev => ({
            ...prev,
            [rutaId]: !prev[rutaId]
        }));
    }, []);

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
        addAll,
        deleteAll,
        collapseAll,
        isExpanded,
        isSelected,          
        toggleSelection,    
        selectedRutas,       
        refreshRutas: fetchRutas
    };
};

export default useGetRutas;