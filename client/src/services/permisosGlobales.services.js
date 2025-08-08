import {
  getModulosConSubmodulosPorPlanRequest,
  getRolesPorPlanRequest,
  getPermisosByRolGlobalRequest,
  checkPermisoGlobalRequest,
  getPlanesDisponiblesRequest,
  savePermisosGlobalesRequest
} from "@/api/api.permisosGlobales";
import { useState, useEffect, useCallback } from 'react';
import { toast } from "react-hot-toast";

// Obtener módulos con submódulos por plan
const getModulosConSubmodulosPorPlan = async () => {
  try {
    const response = await getModulosConSubmodulosPorPlanRequest();
    return response.data;
  } catch (error) {
    toast.error("Error al obtener módulos por plan");
    return [];
  }
};

const getRolesPorPlan = async () => {
  try {
    const response = await getRolesPorPlanRequest();
    return response.data;
  } catch (error) {
    toast.error("Error al obtener roles por plan");
    return [];
  }
};

// Obtener permisos por rol global
const getPermisosByRolGlobal = async (id_rol) => {
  try {
    const response = await getPermisosByRolGlobalRequest(id_rol);
    return response.data;
  } catch (error) {
    toast.error("Error al obtener permisos globales por rol");
    return [];
  }
};

// Chequear permiso global
const checkPermisoGlobal = async (params) => {
  try {
    const response = await checkPermisoGlobalRequest(params);
    return response.data;
  } catch (error) {
    toast.error("Error al chequear permiso global");
    return null;
  }
};

// Obtener planes disponibles
const getPlanesDisponibles = async () => {
  try {
    const response = await getPlanesDisponiblesRequest();
    return response.data;
  } catch (error) {
    toast.error("Error al obtener planes disponibles");
    return [];
  }
};

// Guardar permisos globales
const savePermisosGlobales = async (permisos) => {
  try {
    const response = await savePermisosGlobalesRequest(permisos);
    return response.data;
  } catch (error) {
    toast.error("Error al guardar permisos globales");
    return null;
  }
};

const useGetRutasPorPlan = () => {
    const [modulosConSubmodulos, setModulosConSubmodulos] = useState([]);
    const [planEmpresa, setPlanEmpresa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedModulos, setExpandedModulos] = useState({});

    const fetchRutas = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await getModulosConSubmodulosPorPlanRequest();
            if (response.data && response.data.success) {
                setModulosConSubmodulos(response.data.data || []);
                setPlanEmpresa(response.data.planEmpresa || null);
            } else {
                const errorMsg = response.data?.message || 'Error al obtener las rutas por plan';
                setError(errorMsg);
                setModulosConSubmodulos([]);
            }
        } catch (error) {
            setError(error.response?.data?.message || error.message || 'Error al cargar las rutas por plan');
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

    useEffect(() => {
        fetchRutas();
    }, [fetchRutas]);

    return {
        modulosConSubmodulos,
        planEmpresa,
        loading,
        error,
        expandedModulos,
        toggleExpand,
        expandAll,
        collapseAll,
        refreshRutas: fetchRutas
    };
};

const useRolesPorPlan = () => {
  const [roles, setRoles] = useState([]);
  const [planEmpresa, setPlanEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const response = await getRolesPorPlanRequest();
        if (response.data.success) {
          setRoles(response.data.data);
          setPlanEmpresa(response.data.planEmpresa || null);
        } else {
          setError('Error al obtener los roles por plan');
        }
      } catch (error) {
        setError(error.message || 'Error al obtener los roles por plan');
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  return { roles, planEmpresa, loading, error };
};

function usePermisosByRolGlobal(roleId, selectedPlan) {
  const [permisos, setPermisos] = useState([]);
  const [planEmpresa, setPlanEmpresa] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPermisos = async () => {
    setLoading(true);
    try {
      const response = await getPermisosByRolGlobalRequest(roleId, selectedPlan);
      const data = response.data.data || [];
      setPermisos(data);
      setPlanEmpresa(response.data.planEmpresa || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roleId) {
      setPermisos([]);
      fetchPermisos();
    }
  }, [roleId, selectedPlan]); // Agregar selectedPlan a las dependencias

  return {
    permisos,
    planEmpresa,
    loading,
    refetchPermisos: fetchPermisos,
  };
}

// Hook for saving global permissions
const useSavePermisosGlobales = () => {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const savePermisos = async (roleId, permissionsList, planSeleccionado) => {
    setSaving(true);
    setSuccess(false);
    setError(null);
    
    try {
      const response = await savePermisosGlobalesRequest({
        id_rol: roleId,
        permisos: permissionsList,
        plan_seleccionado: planSeleccionado
      });
      
      if (response.data.success) {
        setSuccess(true);
        return true;
      } else {
        setError('Error al guardar los permisos globales');
        return false;
      }
    } catch (error) {
      console.error('Error saving global permissions:', error);
      setError(error.message || 'Error al guardar los permisos globales');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { savePermisos, saving, success, error };
};

const usePlanesDisponibles = () => {
  const [planes, setPlanes] = useState([
    { id_plan: 1, descripcion_plan: 'Enterprise' },
    { id_plan: 2, descripcion_plan: 'Pro' },
    { id_plan: 3, descripcion_plan: 'Básico' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Comentamos temporalmente la llamada a la API hasta que se ejecute el script SQL
  /*
  useEffect(() => {
    const fetchPlanes = async () => {
      try {
        setLoading(true);
        const response = await getPlanesDisponiblesRequest();
        
        if (response.data.success) {
          setPlanes(response.data.data);
        } else {
          setError('Error al obtener los planes');
        }
      } catch (error) {
        console.error('Error fetching planes:', error);
        setError(error.message || 'Error al obtener los planes');
      } finally {
        setLoading(false);
      }
    };

    fetchPlanes();
  }, []);
  */

  return { planes, loading, error };
};

export {
    getModulosConSubmodulosPorPlan,
    getRolesPorPlan,
    getPermisosByRolGlobal,
    checkPermisoGlobal,
    getPlanesDisponibles,
    savePermisosGlobales,
    useGetRutasPorPlan,
    useRolesPorPlan,
    usePermisosByRolGlobal,
    useSavePermisosGlobales,
    usePlanesDisponibles
};
