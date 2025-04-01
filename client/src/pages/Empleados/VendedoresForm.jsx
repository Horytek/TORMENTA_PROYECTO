import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { IoMdClose, IoMdEye, IoMdEyeOff } from "react-icons/io";
import { Toaster, toast } from "react-hot-toast";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
import { useForm } from "react-hook-form";
import { addVendedor, updateVendedor } from '@/services/vendedor.services';
import { Button } from "@nextui-org/button";
import { getUsuarios } from '@/services/usuario.services';
import { Select, SelectItem } from "@nextui-org/react";
import { getVendedores} from '@/services/vendedor.services';
import '../Productos/ProductosForm.css';

const VendedoresForm = ({ modalTitle, onClose, initialData }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  localStorage.setItem("dni_r", initialData?.dni || '');

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    defaultValues: {
      dni: '',
      id_usuario: '',
      nombres: '',
      apellidos: '',
      telefono: '',
      estado_vendedor: ''
    }
  });

  useEffect(() => {
    if (initialData) {
      // Usar setValue para asegurarse de que los valores del formulario sean correctamente establecidos
      setValue('dni', initialData.dni);
      setValue('id_usuario', initialData.id_usuario);
      setValue('nombres', initialData.nombres);
      setValue('apellidos', initialData.apellidos);
      setValue('telefono', initialData.telefono);
      setValue('estado_vendedor', initialData.estado_vendedor);
    }
  }, [initialData, setValue]);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await getUsuarios();
        setUsuarios(response);

        const data = await getVendedores();
        setVendedores(data);

      } catch (error) {
        toast.error("Error al cargar los usuarios");
      }
    };
    fetchUsuarios();
  }, []);

  /*    const getUsers = async () => {
        const data = await getVendedores();
        setVendedores(data);
    };*/

    const onSubmit = handleSubmit(async (data) => {
      try {
        const { dni, id_usuario, nombres, apellidos, telefono, estado_vendedor } = data;
        const dni_ver = localStorage.getItem("dni_r");
    
        // Asegúrate de que se pase el nuevo dni si se cambia
        const newVendedor = {
          dni: dni_ver || dni, // Usa el dni actual si no hay un nuevo dni
          nuevo_dni: dni_ver !== dni ? dni : undefined, // Si el dni cambia, pasamos nuevo_dni
          id_usuario,
          nombres,
          apellidos,
          telefono,
          estado_vendedor
        };
    
        let result;
        if (initialData) {
          result = await updateVendedor(initialData.dni, newVendedor); 
        } else {
          result = await addVendedor(newVendedor); 
        }
    
        if (result) {
          onClose();
          setTimeout(() => {
            window.location.reload(); // O considera actualizar solo el estado sin recargar
          }, 1000);
        }
    
      } catch (error) {
        toast.error("Error al realizar la gestión del vendedor");
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
                    <label className='text-sm font-bold text-black'>DNI:</label>
                    <input 
                      {...register('dni', { required: true })}
                      type="text"
                      name='dni'
                      className={`w-full bg-gray-50 ${errors.dni ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} />
                  </div>

                  <div className='w-full relative group mb-5 text-start'>
                    <label className='text-sm font-bold text-black'>Usuario:</label>
                    <Select 
                        {...register('id_usuario', { required: true })}
                        onChange={(e) => setValue('id_usuario', e.target.value)}
                        className="w-full bg-gray-50 rounded-lg"
                      >
                        {usuarios.map((usuario) => (
                          <SelectItem 
                            key={usuario.id_usuario} 
                            value={usuario.id_usuario} 
                            isDisabled={vendedores.some((vendedor) => vendedor.id_usuario === usuario.id_usuario) && initialData?.id_usuario !== usuario.id_usuario}
                          >
                            {usuario.usua}
                          </SelectItem>
                        ))}
                      </Select>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-6'>
                  <div className='w-full relative group mb-5 text-start'>
                    <label className='text-sm font-bold text-black'>Nombre:</label>
                    <input 
                      {...register('nombres', { required: true })}
                      type="text"
                      name='nombres'
                      className={`w-full bg-gray-50 ${errors.nombres ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} />
                  </div>

                  <div className='w-full relative group mb-5 text-start'>
                    <label className='text-sm font-bold text-black'>Apellidos:</label>
                    <input 
                      {...register('apellidos', { required: true })}
                      type="text"
                      name='apellidos'
                      className={`w-full bg-gray-50 ${errors.apellidos ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} />
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-6'>
                  <div className='w-full relative group mb-5 text-start'>
                    <label className='text-sm font-bold text-black'>Estado:</label>
                    <select 
                      {...register('estado_vendedor', { required: true })}
                      name='estado_vendedor'
                      className={`w-full text-sm bg-gray-50 ${errors.estado_vendedor ? 'border-red-600 focus:border-red-600 focus:ring-red-600 text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-2`}>
                      <option value="">Seleccione...</option>
                      <option value={1}>Activo</option>
                      <option value={0}>Inactivo</option>
                    </select>
                  </div>

                  <div className='w-full relative group mb-5 text-start'>
                    <label className='text-sm font-bold text-black'>Teléfono:</label>
                    <input 
                      {...register('telefono', { required: true })}
                      type="text"
                      name='telefono'
                      className={`w-full bg-gray-50 ${errors.telefono ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} />
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


VendedoresForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.object
};

export default VendedoresForm;
