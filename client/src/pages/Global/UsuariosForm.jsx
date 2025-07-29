import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { IoMdClose, IoMdEye, IoMdEyeOff } from "react-icons/io";
import { Toaster, toast } from "react-hot-toast";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
import { useForm } from "react-hook-form";
import { addUsuario, updateUsuario } from '@/services/usuario.services';
import { getRoles } from '@/services/rol.services';

const ProductosForm = ({ modalTitle, onClose, initialData }) => {
  const [roles, setRoles] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: initialData?.data || {
      id_rol: '',
      usua: '',
      contra: '',
      estado_usuario: '',
    }
  });

  useEffect(() => {
    getRols();
  }, []);

  useEffect(() => {
    if (initialData && roles.length > 0) {
      reset(initialData.data);
    }
  }, [initialData, roles, reset]);

  const getRols = async () => {
    const data = await getRoles();
    setRoles(data);
  };

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
        onClose();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }

    } catch (error) {
      toast.error("Error al realizar la gestión del usuario");
    }
  });

  return (
    <div>
      <Toaster />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-lg md:max-w-xl bg-white rounded-2xl shadow-2xl border border-blue-100 animate-fade-in"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100 rounded-t-2xl bg-gradient-to-r from-blue-50 to-blue-100">
            <h3 className="text-xl md:text-2xl font-bold text-blue-900">{modalTitle}</h3>
            <button
              type="button"
              className="text-gray-500 hover:text-blue-700 transition-colors"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <IoMdClose className="text-2xl md:text-3xl" />
            </button>
          </div>
          <div className="px-6 py-6 md:py-8 bg-blue-50/60 rounded-b-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="w-full flex flex-col gap-2">
                <label className="text-sm font-bold text-blue-900">Rol:</label>
                <select
                  {...register('id_rol', { required: true })}
                  name='id_rol'
                  className={`w-full text-sm bg-white border ${errors.id_rol ? 'border-red-600 focus:border-red-600 focus:ring-red-600 text-red-500' : 'border-blue-200'} text-blue-900 rounded-lg p-2 transition-all focus:outline-none`}
                >
                  <option value="">Seleccione...</option>
                  {roles.map((rol) => (
                    <option key={rol.id_rol} value={rol.id_rol}>{rol.nom_rol}</option>
                  ))}
                </select>
                {errors.id_rol && <span className="text-xs text-red-500 mt-1">El rol es requerido</span>}
              </div>
              <div className="w-full flex flex-col gap-2">
                <label className="text-sm font-bold text-blue-900">Usuario:</label>
                <input
                  {...register('usua', { required: true })}
                  type="text"
                  name='usua'
                  autoComplete="off"
                  className={`w-full bg-white border ${errors.usua ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-blue-200'} text-blue-900 rounded-lg p-2 transition-all focus:outline-none`}
                  placeholder="Ingrese usuario"
                />
                {errors.usua && <span className="text-xs text-red-500 mt-1">El usuario es requerido</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
              <div className="w-full flex flex-col gap-2">
                <label className="text-sm font-bold text-blue-900">Contraseña:</label>
                <div className="relative">
                  <input
                    {...register('contra', { required: true })}
                    type={showPassword ? "text" : "password"}
                    name='contra'
                    autoComplete="off"
                    className={`w-full bg-white border ${errors.contra ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-blue-200'} text-blue-900 rounded-lg p-2 pr-10 transition-all focus:outline-none`}
                    placeholder="Ingrese contraseña"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    tabIndex={-1}
                    onClick={() => setShowPassword(prev => !prev)}
                  >
                    {showPassword ? <IoMdEyeOff className='text-gray-600' /> : <IoMdEye className='text-gray-600' />}
                  </button>
                </div>
                {errors.contra && <span className="text-xs text-red-500 mt-1">La contraseña es requerida</span>}
              </div>
              <div className="w-full flex flex-col gap-2">
                <label className="text-sm font-bold text-blue-900">Estado:</label>
                <select
                  {...register('estado_usuario', { required: true })}
                  name='estado_usuario'
                  className={`w-full text-sm bg-white border ${errors.estado_usuario ? 'border-red-600 focus:border-red-600 focus:ring-red-600 text-red-500' : 'border-blue-200'} text-blue-900 rounded-lg p-2 transition-all focus:outline-none`}
                >
                  <option value="">Seleccione...</option>
                  <option value={1}>Activo</option>
                  <option value={0}>Inactivo</option>
                </select>
                {errors.estado_usuario && <span className="text-xs text-red-500 mt-1">El estado es requerido</span>}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 justify-end mt-8">
              <ButtonClose onClick={onClose} className="w-full md:w-auto" />
              <ButtonSave type="submit" className="w-full md:w-auto" />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

ProductosForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.object
};

export default ProductosForm;