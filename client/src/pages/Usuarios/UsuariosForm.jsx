/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { IoMdClose } from "react-icons/io";
import { Toaster, toast } from "react-hot-toast";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
import { useForm } from "react-hook-form";
import { addUsuario, updateUsuario } from '@/services/usuario.services';
import { getRoles } from '@/services/rol.services';
import '@/Pages/Productos/ProductosForm.css';

const ProductosForm = ({ modalTitle, onClose, initialData  }) => {

    const [roles, setRoles] = useState([]); // Estado para almacenar los roles

    useEffect(() => {
        const rols = getRoles();
        setRoles(rols);
    }, []);

    // Registro de usuario
    const { register, handleSubmit, formState: {errors} } = useForm({
      defaultValues: initialData?.data || {
        id_rol: '',
        usua: '',
        contra: '',
        estado_usuario: '',
      }
    });

    const onSubmit = handleSubmit(async (data) => {
      try {
        const { id_rol, usua, contra, estado_usuario } = data;
        const newUser = {
          id_rol: parseInt(id_rol),
          usua,
          contra,
          estado_usuario: parseInt(estado_usuario)
        };
        console.log(newUser);
        let result;
        if (initialData) {
          result = await updateUsuario(initialData?.id_usuario,newUser); // Llamada a la API para actualizar un usuario
        } else {
          result = await addUsuario(newUser); // Llamada a la API para añadir el usuario
        }
        
        // Cerrar modal y recargar la página
        if (result) {
          onClose();
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }

      } catch (error) {
        toast.error("Error al realizar la gestión del producto");
      }
    })

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

                {/* Primera Fila */}

                <div className='grid grid-cols-2 gap-6'>
                    <div className='w-full relative group mb-5 text-start'>
                      <label className='text-sm font-bold text-black'>Rol:</label>
                      <select 
                      {...register('id_rol', 
                        { required: true }
                      )}
                      name='id_rol'
                      className={`w-full text-sm bg-gray-50 ${errors.id_rol ? 'border-red-600 focus:border-red-600 focus:ring-red-600 text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-2`}>
                          <option value="">Seleccione...</option>
                          <option value="1">Administrador</option>
                          <option value="3">Vendedor</option>
                      </select>
                    </div>

                    <div className='w-full relative group mb-5 text-start'>
                      <label className='text-sm font-bold text-black'>Usuario:</label>
                      <input 
                      {...register('usua', 
                        { required: true }
                      )}
                      type="text"
                      name='usua'
                      className={`w-full bg-gray-50 ${errors.usua ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} />
                    </div>
                </div>

                {/* Segunda Fila */}

                <div className='grid grid-cols-2 gap-6'>
                    <div className='w-full relative group mb-5 text-start'>
                      <label className='text-sm font-bold text-black'>Contraseña:</label>
                      <input 
                      {...register('contra', 
                        { required: true }
                      )}
                      type="password"
                      name='contra'
                      className={`w-full bg-gray-50 ${errors.contra ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} />
                    </div>
                    <div className='w-full relative group mb-5 text-start'>
                      <label className='text-sm font-bold text-black'>Estado:</label>
                      <select 
                      {...register('estado_usuario', 
                        { required: true }
                      )}
                      name='estado_usuario'
                      className={`w-full text-sm bg-gray-50 ${errors.estado_usuario ? 'border-red-600 focus:border-red-600 focus:ring-red-600 text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-2`}>
                        <option value="">Seleccione...</option>
                        <option value={1} >Activo</option>
                        <option value={0} >Inactivo</option>
                      </select>
                    </div>
                  </div>
      
                {/* Final de Form */}
      
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