import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getNegocio, updateNegocio } from '@/services/negocio.services';

export const useNegocio = () => {
  // Estados de formulario
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ruc, setRuc] = useState('');
  const [logo, setLogo] = useState(null); // File
  const [logotipoUrl, setLogotipoUrl] = useState(''); // String URL (ImgBB)
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
          setRuc(data.ruc || '');
          if (data.logo_url) {
            setPreview(data.logo_url);
            setLogotipoUrl(data.logo_url);
          }
          setInitialData({
            nombre: data.nombre_negocio || '',
            direccion: data.direccion || '',
            ruc: data.ruc || '',
            logo_url: data.logo_url || null
          });
        }
      } catch (err) {
        // Podemos loguear para debug sin romper UX
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleLogoChange = (e) => {
    // Si viene un evento de input file
    if (e.target?.files) {
      const file = e.target.files?.[0];
      setLogo(file || null);
      if (file) {
        if (!file.type.startsWith('image/')) {
          toast.error('El archivo debe ser una imagen');
          return;
        }
        if (file.size > 1024 * 1024 * 5) { // 5MB match middleware
          toast.error('La imagen supera 5MB');
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(file);
        setLogotipoUrl(''); // Limpiar URL si se selecciona archivo
      }
    }
  };

  const handleLogotipoPaste = (e) => {
    // Logic from RegistroForm
    const pasted = e.clipboardData.getData('text');
    const matches = pasted.match(/https:\/\/i\.ibb\.co\/[^\s\[\]]+\.(jpg|png)/gi);
    const url = matches && matches.length > 1 ? matches[1] : matches?.[0] || '';

    if (url) {
      setLogotipoUrl(url);
      setPreview(url);
      setLogo(null); // Clear file if URL pasted
      e.preventDefault();
      toast.success("URL de ImgBB detectada");
    }
  };

  // Manual text change
  const onLogotipoUrlChange = (val) => {
    setLogotipoUrl(val);
    // If it looks like a url, set preview
    if (val.startsWith('http')) {
      setPreview(val);
      setLogo(null);
    }
  }

  const resetChanges = () => {
    if (!initialData) return;
    setNombre(initialData.nombre);
    setDireccion(initialData.direccion);
    setRuc(initialData.ruc);
    setLogo(null);
    setLogotipoUrl(initialData.logo_url || '');
    setPreview(initialData.logo_url || null);
    toast('Cambios revertidos');
  };

  const removeLogo = () => {
    setLogo(null);
    setLogotipoUrl('');
    setPreview(null);
  };

  const hasChanges = () => {
    if (!initialData) return true; // Durante primera carga evitar bloquear guardado
    return (
      nombre !== initialData.nombre ||
      direccion !== initialData.direccion ||
      ruc !== initialData.ruc ||
      (!!logo) ||
      (logotipoUrl !== (initialData.logo_url || '')) ||
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
      formData.append('ruc', ruc.trim());

      if (logo) {
        formData.append('logo', logo);
      } else if (logotipoUrl) {
        formData.append('logotipo', logotipoUrl.trim());
      }

      if (!preview && initialData?.logo_url) {
        formData.append('eliminar_logo', '1');
      }

      const updated = await updateNegocio(formData);
      toast.success('Configuración guardada');
      setInitialData({
        nombre: updated?.nombre_negocio || nombre,
        direccion: updated?.direccion || direccion,
        ruc: updated?.ruc || ruc,
        logo_url: updated?.logo_url || (preview || null)
      });

      if (!logo && !preview) {
        // Eliminado
        setPreview(null);
        setLogotipoUrl('');
      } else if (updated?.logo_url) {
        setPreview(updated.logo_url);
        setLogotipoUrl(updated.logo_url);
      }
      setLogo(null); // Limpiamos file en memoria
    } catch (err) {
      //console.error(err);
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
    ruc,
    setRuc,
    logo,
    logotipoUrl,
    setLogotipoUrl,
    preview,
    loading,
    saving,
    initialData,
    // Funciones
    handleLogoChange,
    handleLogotipoPaste,
    onLogotipoUrlChange,
    resetChanges,
    removeLogo,
    hasChanges: hasChanges(),
    handleSubmit
  };
};
