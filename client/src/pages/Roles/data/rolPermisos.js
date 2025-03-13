import { useState, useEffect } from 'react';
import axios from "@/api/axios";

export const useRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/permisos/roles');
        
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

export function usePermisosByRol(roleId) {
  const [permisos, setPermisos] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPermisos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/permisos/roles/${roleId}`);
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
export const useSavePermisos = () => {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const savePermisos = async (roleId, permissionsList) => {
    setSaving(true);
    setSuccess(false);
    setError(null);
    
    try {
      const response = await axios.post('/permisos/save', {
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

export const usePermisosManager = () => {
  const { roles, loading: rolesLoading, error: rolesError } = useRoles();
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const { permisos, loading: permisosLoading, error: permisosError, refetchPermisos } = usePermisosByRol(selectedRoleId);
  const { savePermisos, saving, success, error: saveError } = useSavePermisos();

  return {
    roles,
    rolesLoading,
    rolesError,
    
    selectedRoleId,
    setSelectedRoleId,
    
    permisos,
    permisosLoading,
    permisosError,
    
    savePermisos,
    saving,
    success,
    saveError,
    refetchPermisos
  };
};