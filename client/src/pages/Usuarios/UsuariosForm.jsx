import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { IoMdClose, IoMdEye, IoMdEyeOff } from "react-icons/io";
import { Toaster, toast } from "react-hot-toast";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
import { useForm } from "react-hook-form";
import { addUsuario, updateUsuario } from '@/services/usuario.services';
import { getRoles } from '@/services/rol.services';
import '@/Pages/Productos/ProductosForm.css';

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
      // Cuando los roles y los datos iniciales están disponibles, actualiza el formulario
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
        <form onSubmit={onSubmit}>
          <Toaster />
          <div className="modal-overlay">
            <div className="modal">
              <div className='content-modal'>
                <div className="modal-header">
                  <h3 className="modal-title">{modalTitle}</h3>
                  <button className="modal-close" onClick={onClose}>
                    <IoMdClose className='text-3xl'/>
                  </button>
                </div>
                <div className='modal-body'>
                  <div className='grid grid-cols-2 gap-6'>
                    <div className='w-full relative group mb-5 text-start'>
                      <label className='text-sm font-bold text-black'>Rol:</label>
                      <select 
                        {...register('id_rol', { required: true })}
                        name='id_rol'
                        className={`w-full text-sm bg-gray-50 ${errors.id_rol ? 'border-red-600 focus:border-red-600 focus:ring-red-600 text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-2`}>
                        <option value="">Seleccione...</option>
                        {roles.map((rol) => (
                          <option key={rol.id_rol} value={rol.id_rol}>{rol.nom_rol}</option>
                        ))}
                      </select>
                    </div>

                    <div className='w-full relative group mb-5 text-start'>
                      <label className='text-sm font-bold text-black'>Usuario:</label>
                      <input 
                        {...register('usua', { required: true })}
                        type="text"
                        name='usua'
                        className={`w-full bg-gray-50 ${errors.usua ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} />
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-6'>
                    <div className='w-full relative group mb-5 text-start'>
                      <label className='text-sm font-bold text-black'>Contraseña:</label>
                      <div className="relative">
                        <input 
                          {...register('contra', { required: true })}
                          type={showPassword ? "text" : "password"} 
                          name='contra'
                          className={`w-full bg-gray-50 ${errors.contra ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center pr-3"
                          onClick={() => setShowPassword(prev => !prev)} 
                        >
                          {showPassword ? <IoMdEyeOff className='text-gray-600' /> : <IoMdEye className='text-gray-600'/>}
                        </button>
                      </div>
                    </div>
                    <div className='w-full relative group mb-5 text-start'>
                      <label className='text-sm font-bold text-black'>Estado:</label>
                      <select 
                        {...register('estado_usuario', { required: true })}
                        name='estado_usuario'
                        className={`w-full text-sm bg-gray-50 ${errors.estado_usuario ? 'border-red-600 focus:border-red-600 focus:ring-red-600 text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-2`}>
                        <option value="">Seleccione...</option>
                        <option value={1}>Activo</option>
                        <option value={0}>Inactivo</option>
                      </select>
                    </div>
                  </div>

                  <div className='modal-buttons'>
                    <ButtonClose onClick={onClose}/>
                    <ButtonSave type="submit"/>
                  </div>
                </div>
              </div>
            </div> 
          </div>
        </form>
      </div>
    );
};

ProductosForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.object
};

export default ProductosForm;