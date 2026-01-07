import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { IoMdClose, IoMdEye, IoMdEyeOff } from "react-icons/io";
import { toast } from "react-hot-toast";
import { Button } from "@heroui/react";
import { useForm } from "react-hook-form";
import { addUsuario, updateUsuario } from '@/services/usuario.services';

const UsuariosForm = ({ modalTitle, onClose, initialData }) => {
  const [showPassword, setShowPassword] = useState(false);

  // Default to Role ID 1 (Administrator)
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: initialData?.data || {
      id_rol: '1',
      usua: '',
      contra: '',
      estado_usuario: '',
    }
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData.data);
    }
  }, [initialData, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const { id_rol, usua, contra, estado_usuario } = data;
      const newUser = {
        id_rol: parseInt(id_rol),
        usua,
        contra,
        estado_usuario: parseInt(estado_usuario)
      };

      let result;
      if (initialData) {
        result = await updateUsuario(initialData?.id_usuario, newUser);
      } else {
        result = await addUsuario(newUser);
      }

      if (result) {
        toast.success(initialData ? "Usuario actualizado" : "Usuario creado exitosamente");
        onClose();
      } else {
        toast.error("Error al guardar el usuario");
      }

    } catch (error) {
      console.error(error);
      toast.error("Error al realizar la gestión del usuario");
    }
  });

  return (
    <div>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-xl shadow-2xl animate-fade-in overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{modalTitle}</h3>
            <button
              type="button"
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <IoMdClose className="text-xl" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Role - Restricted to Administrator */}
              <div className="w-full flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Rol</label>
                <div className="relative">
                  <select
                    {...register('id_rol', { required: true })}
                    className="w-full text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-lg p-2.5 outline-none cursor-not-allowed"
                    disabled
                  >
                    <option value="1">Administrador</option>
                  </select>
                  {/* Hidden input to ensure value is sent if disabled doesn't send it (though defaultValues usually handle it, safest to rely on defaultValues + disabled) */}
                  <input type="hidden" {...register('id_rol')} value="1" />
                </div>
              </div>

              {/* Usuario */}
              <div className="w-full flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Usuario</label>
                <input
                  {...register('usua', { required: true })}
                  type="text"
                  autoComplete="off"
                  className={`w-full text-sm bg-white dark:bg-zinc-900 border ${errors.usua ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'} text-zinc-900 dark:text-zinc-100 rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all`}
                  placeholder="Ingrese usuario"
                />
                {errors.usua && <span className="text-xs text-red-500">El usuario es requerido</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Contraseña */}
              <div className="w-full flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Contraseña</label>
                <div className="relative">
                  <input
                    {...register('contra', { required: !initialData })} // Only required if new
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className={`w-full text-sm bg-white dark:bg-zinc-900 border ${errors.contra ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'} text-zinc-900 dark:text-zinc-100 rounded-lg p-2.5 pr-10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all`}
                    placeholder={initialData ? "Sin cambios" : "Ingrese contraseña"}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600"
                    onClick={() => setShowPassword(prev => !prev)}
                  >
                    {showPassword ? <IoMdEyeOff /> : <IoMdEye />}
                  </button>
                </div>
                {errors.contra && <span className="text-xs text-red-500">La contraseña es requerida</span>}
              </div>

              {/* Estado */}
              <div className="w-full flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Estado</label>
                <select
                  {...register('estado_usuario', { required: true })}
                  className={`w-full text-sm bg-white dark:bg-zinc-900 border ${errors.estado_usuario ? 'border-red-500' : 'border-zinc-300 dark:border-zinc-700'} text-zinc-900 dark:text-zinc-100 rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all`}
                >
                  <option value="">Seleccione...</option>
                  <option value={1}>Activo</option>
                  <option value={0}>Inactivo</option>
                </select>
                {errors.estado_usuario && <span className="text-xs text-red-500">El estado es requerido</span>}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              onPress={onClose}
              variant="light"
              color="danger"
              className="font-medium"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              color="primary"
              className="font-medium px-6 shadow-lg shadow-blue-500/20"
            >
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

UsuariosForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.object
};

export default UsuariosForm;