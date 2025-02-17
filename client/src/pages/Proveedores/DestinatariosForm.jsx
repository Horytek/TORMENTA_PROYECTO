import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { IoMdClose } from "react-icons/io";
import { Toaster, toast } from "react-hot-toast";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
import { useForm } from "react-hook-form";
import { insertDestinatario, updateDestinatario } from '@/services/destinatario.services';
import '../Productos/ProductosForm.css';

const DestinatariosForm = ({ modalTitle, onClose, initialData }) => {
    
    const [showPassword, setShowPassword] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [destinatarios, setDestinatarios] = useState([]);

  

  const [documento, setDocumento] = useState(initialData?.documento || '');
const [isDNI, setIsDNI] = useState(documento.length === 8);
const [isRUC, setIsRUC] = useState(documento.length === 11);

const handleDocumentoChange = (e) => {
  const value = e.target.value;
  if (/^\d{0,11}$/.test(value)) { // Permitir solo números y máximo 11 dígitos
    setDocumento(value);
    setIsDNI(value.length === 8);
    setIsRUC(value.length === 11);
    setValue('documento', value);
    console.log("Documento actualizado:", value); // Verifica que el valor cambia correctamente
  }
};

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    defaultValues: {
      documento: '',
        destinatario: '',
        ubicacion: '',
        direccion: '',
        email: '',
        telefono: ''
    }
});


  useEffect(() => {
    if (initialData) {
      // Usar setValue para asegurarse de que los valores del formulario sean correctamente establecidos
      console.log("initialData recibida:", initialData);
      setValue('documento', initialData.documento);
      setValue('destinatario', initialData.destinatario);
      setValue('ubicacion', initialData.ubicacion);
      setValue('direccion', initialData.direccion);
      setValue('email', initialData.email);
      setValue('telefono', initialData.telefono);
    }
  }, [initialData, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const { documento, destinatario, ubicacion, direccion, email, telefono } = data;
      const storedDoc = localStorage.getItem("doc_r"); // Puede ser DNI o RUC
  
      // Determinar el tipo de documento (DNI o RUC)
      const tipo_doc = documento.length === 8 ? "DNI" : documento.length === 11 ? "RUC" : "Desconocido";
  
      // Construir el objeto con diferenciación
      const newDestinatario = {
        documento: storedDoc || documento, // Usa el doc actual si no hay cambios
        nuevo_doc: storedDoc !== documento ? documento : undefined, // Si cambia, se pasa nuevo_doc
        tipo_doc, // Guarda el tipo de documento
        destinatario,
        ubicacion,
        direccion,
        telefono,
        email
        
      };
  
      let result;
      if (initialData) {
        result = await updateDestinatario(initialData.documento, newDestinatario);
      } else {
        result = await insertDestinatario(newDestinatario);
      }
  
      if (result) {
        onClose();
        setTimeout(() => {
          window.location.reload(); // O considera actualizar solo el estado sin recargar
        }, 1000);
      }
    } catch (error) {
      toast.error("Error al gestionar el vendedor");
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
                {/* Documento (DNI/RUC) */}
                <div className='w-full relative group mb-5 text-start'>
                <label className='text-sm font-bold text-black'>Documento:</label>
                <input 
                  {...register('documento', { required: true, minLength: 8, maxLength: 11 })}
                  type="text"
                  name='documento'
                  value={documento}
                  onChange={handleDocumentoChange}
                  className={`w-full bg-gray-50 ${errors.documento ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} 
                />
              </div>
  
                {/* Nombre y Apellidos */}
                {isDNI && (
                  <>
                  <div className='grid grid-cols-2 gap-6'>
                  <div className='w-full relative group mb-5 text-start'>
                    <label className='text-sm font-bold text-black'>Nombre:</label>
                    <input 
                      {...register('destinatarios', { required: true })}
                      type="text"
                      name='destinatarios'
                      className={`w-full bg-gray-50 ${errors.destinatario ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} />
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
                  </>

                )}
                
  
                {/* Razón Social y Ubicación */}
                {isRUC && (
                  <div className='w-full relative group mb-5 text-start'>
                    <label className='text-sm font-bold text-black'>Razón Social:</label>
                    <input 
                      {...register('razonsocial', { required: true })}
                      type="text"
                      name='razonsocial'
                      className={`w-full bg-gray-50 ${errors.razonsocial ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} />
                  </div>
                )}

                {/* Telefono y Direccion */}
                <div className='grid grid-cols-2 gap-6'>
                <div className='w-full relative group mb-5 text-start'>
                  <label className='text-sm font-bold text-black'>Teléfono:</label>
                  <input 
                    {...register('telefono', { required: true })}
                    type="text"
                    name='telefono'
                    className={`w-full bg-gray-50 ${errors.telefono ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} />
                </div>
  
                <div className='w-full relative group mb-5 text-start'>
                    <label className='text-sm font-bold text-black'>Ubicación:</label>
                    <input 
                      {...register('ubicacion', { required: true })}
                      type="text"
                      name='ubicacion'
                      className={`w-full bg-gray-50 ${errors.ubicacion ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} />
                  </div>
                </div>
                <div className='w-full relative group mb-5 text-start'>
                    <label className='text-sm font-bold text-black'>Dirección:</label>
                    <input 
                      {...register('direccion', { required: true })}
                      type="text"
                      name='direccion'
                      className={`w-full bg-gray-50 ${errors.direccion ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} />
                  </div>
  
  
                {/* Teléfono */}
                <div className='w-full relative group mb-5 text-start'>
                  <label className='text-sm font-bold text-black'>Email:</label>
                  <input 
                    {...register('email', { required: true })}
                    type="text"
                    name='email'
                    className={`w-full bg-gray-50 ${errors.email ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} />
                </div>
  
                {/* Botones */}
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

DestinatariosForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.object
};

export default DestinatariosForm;