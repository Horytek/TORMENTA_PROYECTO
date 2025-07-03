import {
  getModulosConSubmodulosRequest,
  getRolesRequest,
  getPermisosByRolRequest,
  checkPermisoRequest,
  getPermisosModuloRequest,
  savePermisosRequest
} from "@/api/api.permisos";
import { useState, useEffect, useCallback } from 'react';
import { toast } from "react-hot-toast";

// Obtener módulos con submódulos
const getModulosConSubmodulos = async () => {
  try {
    const response = await getModulosConSubmodulosRequest();
    return response.data;
  } catch (error) {
    toast.error("Error al obtener módulos y submódulos");
    return [];
  }
};

const getRoles = async () => {
  try {
    const response = await getRolesRequest();
    return response.data;
  } catch (error) {
    toast.error("Error al obtener roles");
    return [];
  }
};

// Obtener permisos por rol
const getPermisosByRol = async (id_rol) => {
  try {
    const response = await getPermisosByRolRequest(id_rol);
    return response.data;
  } catch (error) {
    toast.error("Error al obtener permisos por rol");
    return [];
  }
};

// Chequear permiso
const checkPermiso = async (params) => {
  try {
    const response = await checkPermisoRequest(params);
    return response.data;
  } catch (error) {
    toast.error("Error al chequear permiso");
    return null;
  }
};

// Obtener permisos de un módulo por rol
const getPermisosModulo = async (id_rol) => {
  try {
    const response = await getPermisosModuloRequest(id_rol);
    return response.data;
  } catch (error) {
    toast.error("Error al obtener permisos del módulo");
    return [];
  }
};

// Guardar permisos
const savePermisos = async (permisos) => {
  try {
    const response = await savePermisosRequest(permisos);
    return response.data;
  } catch (error) {
    toast.error("Error al guardar permisos");
    return null;
  }
};

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
           const response = await getModulosConSubmodulosRequest();
            
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

const useRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const response = await getRolesRequest();
        
        if (response.data.success) {
          setRoles(response.data.data);
        } else {
          setError('Error al obtener los roles');
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
        setError(error.message || 'Error al obtener los roles');
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  return { roles, loading, error };
};

function usePermisosByRol(roleId) {
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPermisos = async () => {
    setLoading(true);
    try {
      const response = await getPermisosByRolRequest(roleId);
      const data = response.data.data || []; // Ensure we always have an array
      setPermisos(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roleId) {
      setPermisos([]); // Reset permissions when role changes
      fetchPermisos();
    }
  }, [roleId]);

  return {
    permisos,
    loading,
    refetchPermisos: fetchPermisos,
  };
}

// Hook for saving permissions
const useSavePermisos = () => {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const savePermisos = async (roleId, permissionsList) => {
    setSaving(true);
    setSuccess(false);
    setError(null);
    
    try {
      const response = await savePermisosRequest({
        id_rol: roleId,
        permisos: permissionsList
      });
      
      if (response.data.success) {
        setSuccess(true);
        return true;
      } else {
        setError('Error al guardar los permisos');
        return false;
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      setError(error.message || 'Error al guardar los permisos');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { savePermisos, saving, success, error };
};

export {
    getModulosConSubmodulos,
    getRoles,
    getPermisosByRol,
    checkPermiso,
    getPermisosModulo,
    savePermisos,
    useGetRutas,
    useRoles,
    usePermisosByRol,
    useSavePermisos
    };