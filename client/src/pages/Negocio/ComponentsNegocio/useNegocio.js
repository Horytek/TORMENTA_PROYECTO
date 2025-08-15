import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getNegocio, updateNegocio } from '@/services/negocio.services';

export const useNegocio = () => {
  // Estados de formulario
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [logo, setLogo] = useState(null); // File
  const [preview, setPreview] = useState(null); // DataURL o URL existente

  // Estados de ciclo de vida
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialData, setInitialData] = useState(null);

  // Cargar datos actuales del negocio
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getNegocio();
        if (!mounted) return;
        if (data) {
          setNombre(data.nombre_negocio || '');
          setDireccion(data.direccion || '');
          if (data.logo_url) {
            setPreview(data.logo_url); // Usamos URL directa del backend/CDN
          }
          setInitialData({
            nombre: data.nombre_negocio || '',
            direccion: data.direccion || '',
            logo_url: data.logo_url || null
          });
        }
      } catch (err) {
        // Podemos loguear para debug sin romper UX
        console.error('Error cargando configuración negocio', err);
        toast.error('No se pudo cargar la configuración');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    setLogo(file || null);
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('El archivo debe ser una imagen');
        return;
      }
      if (file.size > 1024 * 1024 * 2) { // 2MB
        toast.error('La imagen supera 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(initialData?.logo_url || null);
    }
  };

  const resetChanges = () => {
    if (!initialData) return;
    setNombre(initialData.nombre);
    setDireccion(initialData.direccion);
    setLogo(null);
    setPreview(initialData.logo_url || null);
    toast('Cambios revertidos');
  };

  const removeLogo = () => {
    setLogo(null);
    setPreview(null);
  };

  const hasChanges = () => {
    if (!initialData) return true; // Durante primera carga evitar bloquear guardado
    return (
      nombre !== initialData.nombre ||
      direccion !== initialData.direccion ||
      (!!logo) ||
      (!preview && !!initialData.logo_url) // se eliminó logo
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('nombre_negocio', nombre.trim());
      formData.append('direccion', direccion.trim());
      if (logo) formData.append('logo', logo);
      if (!preview && initialData?.logo_url) {
        formData.append('eliminar_logo', '1');
      }
      const updated = await updateNegocio(formData);
      toast.success('Configuración guardada');
      setInitialData({
        nombre: updated?.nombre_negocio || nombre,
        direccion: updated?.direccion || direccion,
        logo_url: updated?.logo_url || (preview || null)
      });
      if (!logo && !preview) {
        // Eliminado
        setPreview(null);
      } else if (updated?.logo_url) {
        setPreview(updated.logo_url);
      }
      setLogo(null); // Limpiamos file en memoria
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return {
    // Estado
    nombre,
    setNombre,
    direccion,
    setDireccion,
    logo,
    preview,
    loading,
    saving,
    initialData,
    // Funciones
    handleLogoChange,
    resetChanges,
    removeLogo,
    hasChanges: hasChanges(),
    handleSubmit
  };
};
