import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, Textarea, Tooltip, Spinner } from '@heroui/react';
import { Toaster, toast } from 'react-hot-toast';
import { FaSave, FaUndo, FaTrashAlt, FaUpload } from 'react-icons/fa';
import { getNegocio, updateNegocio } from '@/services/negocio.services';

export default function Negocio() {
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

  const hasChanges = useMemo(() => {
    if (!initialData) return true; // Durante primera carga evitar bloquear guardado
    return (
      nombre !== initialData.nombre ||
      direccion !== initialData.direccion ||
      (!!logo) ||
      (!preview && !!initialData.logo_url) // se eliminó logo
    );
  }, [nombre, direccion, logo, preview, initialData]);

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

  return (
    <div className="m-4">
      <Toaster />
      <h1 className="font-extrabold text-4xl text-blue-900 tracking-tight mb-1">Configuración del negocio</h1>
      <p className="text-base text-blue-700/80 mb-6">Actualiza los datos visibles en tus comprobantes, documentos y panel.</p>

      {loading ? (
        <div className="flex items-center gap-3 bg-white rounded-xl shadow-sm p-8 justify-center">
          <Spinner color="primary" size="lg" />
          <span className="text-blue-700 font-medium">Cargando configuración...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-blue-50/60 hover:border-blue-200 transition-colors p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">Información general</h2>
              <div className="grid md:grid-cols-2 gap-5">
                <Input
                  label="Nombre del negocio"
                  variant="bordered"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  isRequired
                />
                <Textarea
                  label="Dirección"
                  variant="bordered"
                  minRows={2}
                  value={direccion}
                  onChange={e => setDireccion(e.target.value)}
                  isRequired
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Tooltip content="Revertir cambios no guardados" color="primary" offset={8}>
                <Button
                  type="button"
                  variant="flat"
                  color="primary"
                  startContent={<FaUndo />}
                  onClick={resetChanges}
                  isDisabled={!hasChanges || saving}
                  className="font-semibold"
                >
                  Revertir
                </Button>
              </Tooltip>
              <Button
                type="submit"
                color="primary"
                startContent={<FaSave />}
                isDisabled={!hasChanges}
                isLoading={saving}
                className="font-semibold shadow-sm"
              >
                Guardar cambios
              </Button>
            </div>
          </div>

            {/* Columna lateral: Logo */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-blue-50/60 hover:border-blue-200 transition-colors p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-blue-900">Identidad visual</h2>
                    <p className="text-xs text-blue-600/70 mt-1">PNG o JPG, fondo transparente recomendado. Máx 2MB.</p>
                  </div>
                  {preview && (
                    <Tooltip content="Eliminar logo" color="danger" offset={6}>
                      <Button
                        size="sm"
                        color="danger"
                        variant="light"
                        isIconOnly
                        onClick={removeLogo}
                      >
                        <FaTrashAlt className="text-[15px]" />
                      </Button>
                    </Tooltip>
                  )}
                </div>

                <div className="border border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center bg-gradient-to-br from-blue-50/40 to-white">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Logo preview"
                      className="max-h-40 object-contain drop-shadow-sm transition-all"
                    />
                  ) : (
                    <div className="text-blue-700/60 text-sm font-medium py-6">Sin logo</div>
                  )}
                  <label className="mt-4 inline-flex items-center gap-2 cursor-pointer text-sm font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200/80 px-4 py-2 rounded-full transition">
                    <FaUpload className="text-blue-700" />
                    <span>{preview ? 'Cambiar logo' : 'Subir logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                  {logo && (
                    <p className="mt-2 text-[11px] text-blue-600/70">{logo.name} ({(logo.size/1024).toFixed(1)} KB)</p>
                  )}
                </div>
              </div>
            </div>
        </form>
      )}
    </div>
  );
}
