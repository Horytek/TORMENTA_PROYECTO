import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getNegocio, updateNegocio } from '@/services/negocio.services';
import { uploadLogo } from '@/services/imagekit.services';

export const useNegocio = () => {
  // Estados de formulario
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ruc, setRuc] = useState('');
  const [logo, setLogo] = useState(null); // File
  const [logotipoUrl, setLogotipoUrl] = useState(''); // String URL (ImgBB/ImageKit)
  const [preview, setPreview] = useState(null); // DataURL o URL existente

  // Nuevos campos
  const [distrito, setDistrito] = useState('');
  const [provincia, setProvincia] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [moneda, setMoneda] = useState('PEN');
  const [pais, setPais] = useState('PE');

  const [idEmpresa, setIdEmpresa] = useState(null);

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
          setIdEmpresa(data.id_empresa);
          setNombre(data.nombre_negocio || '');
          setDireccion(data.direccion || '');
          setRuc(data.ruc || '');

          setDistrito(data.distrito || '');
          setProvincia(data.provincia || '');
          setDepartamento(data.departamento || '');
          setCodigoPostal(data.codigoPostal || '');
          setEmail(data.email || '');
          setTelefono(data.telefono || '');
          setMoneda(data.moneda || 'PEN');
          setPais(data.pais || 'PE');

          if (data.logo_url) {
            setPreview(data.logo_url);
            setLogotipoUrl(data.logo_url);
          }
          setInitialData({
            nombre: data.nombre_negocio || '',
            direccion: data.direccion || '',
            ruc: data.ruc || '',
            logo_url: data.logo_url || null,
            distrito: data.distrito || '',
            provincia: data.provincia || '',
            departamento: data.departamento || '',
            codigoPostal: data.codigoPostal || '',
            email: data.email || '',
            telefono: data.telefono || '',
            moneda: data.moneda || 'PEN',
            pais: data.pais || 'PE'
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
    setDistrito(initialData.distrito);
    setProvincia(initialData.provincia);
    setDepartamento(initialData.departamento);
    setCodigoPostal(initialData.codigoPostal);
    setEmail(initialData.email);
    setTelefono(initialData.telefono);
    setMoneda(initialData.moneda);
    setPais(initialData.pais);

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
      distrito !== initialData.distrito ||
      provincia !== initialData.provincia ||
      departamento !== initialData.departamento ||
      codigoPostal !== initialData.codigoPostal ||
      email !== initialData.email ||
      telefono !== initialData.telefono ||
      moneda !== initialData.moneda ||
      pais !== initialData.pais ||
      (!!logo) ||
      (logotipoUrl !== (initialData.logo_url || '')) ||
      (!preview && !!initialData.logo_url) // se eliminó logo
    );
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (saving) return;
    setSaving(true);

    const saveOperation = async () => {
      let finalLogoUrl = logotipoUrl;

      // 1. Subir logo a ImageKit si hay un archivo seleccionado
      if (logo && preview && idEmpresa) {
        try {
          const uploadRes = await uploadLogo(preview, idEmpresa);
          if (uploadRes && uploadRes.url) {
            finalLogoUrl = uploadRes.url;
          }
        } catch (uploadError) {
          console.error("Error subiendo a ImageKit", uploadError);
          throw new Error("Error al subir imagen");
        }
      }

      const formData = new FormData();
      formData.append('nombre_negocio', nombre.trim());
      formData.append('direccion', direccion.trim());
      formData.append('ruc', ruc.trim());

      formData.append('distrito', distrito.trim());
      formData.append('provincia', provincia.trim());
      formData.append('departamento', departamento.trim());
      formData.append('codigoPostal', codigoPostal.trim());
      formData.append('email', email.trim());
      formData.append('telefono', telefono.trim());
      formData.append('moneda', moneda.trim());
      formData.append('pais', pais.trim());

      // Si tenemos una URL final (ya sea nueva de ImageKit o la existente del input)
      if (finalLogoUrl) {
        formData.append('logotipo', finalLogoUrl.trim());
      }

      if (!preview && initialData?.logo_url) {
        formData.append('eliminar_logo', '1');
      }

      const updated = await updateNegocio(formData);

      const newLogoUrl = updated?.logo_url || (finalLogoUrl || null);

      setInitialData({
        nombre: updated?.nombre_negocio || nombre,
        direccion: updated?.direccion || direccion,
        ruc: updated?.ruc || ruc,
        logo_url: newLogoUrl,
        distrito: updated?.distrito || distrito,
        provincia: updated?.provincia || provincia,
        departamento: updated?.departamento || departamento,
        codigoPostal: updated?.codigoPostal || codigoPostal,
        email: updated?.email || email,
        telefono: updated?.telefono || telefono,
        moneda: updated?.moneda || moneda,
        pais: updated?.pais || pais
      });

      if (!newLogoUrl) {
        // Eliminado
        setPreview(null);
        setLogotipoUrl('');
      } else {
        setPreview(newLogoUrl);
        setLogotipoUrl(newLogoUrl);
      }
      setLogo(null); // Limpiamos file en memoria
      return "Configuración guardada";
    };

    toast.promise(
      saveOperation(),
      {
        loading: 'Guardando configuración...',
        success: (msg) => msg,
        error: (err) => {
          console.error(err);
          return 'Error al guardar configuración';
        }
      }
    ).finally(() => {
      setSaving(false);
    });
  };

  return {
    // Estado
    nombre, setNombre,
    direccion, setDireccion,
    ruc, setRuc,
    distrito, setDistrito,
    provincia, setProvincia,
    departamento, setDepartamento,
    codigoPostal, setCodigoPostal,
    email, setEmail,
    telefono, setTelefono,
    moneda, setMoneda,
    pais, setPais,

    logo,
    logotipoUrl, setLogotipoUrl,
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
