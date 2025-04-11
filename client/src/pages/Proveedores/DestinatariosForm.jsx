import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { IoMdClose } from "react-icons/io";
import { Toaster, toast } from "react-hot-toast";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
import { useForm } from "react-hook-form";
import { insertDestinatario, updateDestinatario } from '@/services/destinatario.services';
import '../Productos/ProductosForm.css';

const DestinatariosForm = ({ modalTitle, onClose, initialData }) => {
  const [documento, setDocumento] = useState(initialData?.documento || '');
  const [isDNI, setIsDNI] = useState(documento?.length === 8);
  const [isRUC, setIsRUC] = useState(documento?.length === 11);
  const isEditMode = !!initialData; 
  
  const parseInitialData = () => {
    if (!initialData) return {};
    
    const result = {
      documento: initialData.documento,
      ubicacion: initialData.ubicacion || '',
      direccion: initialData.direccion || '',
      email: initialData.email || '',
      telefono: initialData.telefono || ''
    };
    
    if (initialData.documento?.length === 8) {
      const nameParts = initialData.destinatario?.split(' ') || [];
      if (nameParts.length > 0) {
        result.nombre = nameParts[0];
        result.apellidos = nameParts.slice(1).join(' ');
      }
    } else if (initialData.documento?.length === 11) {
      // For RUC, use destinatario as razonsocial
      result.razonsocial = initialData.destinatario;
    }
    
    return result;
  };
  
  const parsedInitialData = parseInitialData();

  const handleDocumentoChange = (e) => {
    const value = e.target.value;
    if (/^\d{0,11}$/.test(value)) { // Permitir solo números y máximo 11 dígitos
      setDocumento(value);
      setIsDNI(value.length === 8);
      setIsRUC(value.length === 11);
      setValue('documento', value);
    }
  };

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    defaultValues: {
      documento: parsedInitialData.documento || '',
      nombre: parsedInitialData.nombre || '',
      apellidos: parsedInitialData.apellidos || '',
      razonsocial: parsedInitialData.razonsocial || '',
      ubicacion: parsedInitialData.ubicacion || '',
      direccion: parsedInitialData.direccion || '',
      email: parsedInitialData.email || '',
      telefono: parsedInitialData.telefono || ''
    }
  });

  // Helper function to check if a field is null/empty in edit mode
  const isFieldEmpty = (fieldName) => {
    if (!isEditMode) return false; // Not in edit mode, field should be editable
    
    const value = initialData[fieldName];
    return value === null || value === undefined || value === '';
  };

  useEffect(() => {
    if (initialData) {
      console.log("initialData recibida:", initialData);
      const parsedData = parseInitialData();
      
      setValue('documento', parsedData.documento || '');
      setValue('nombre', parsedData.nombre || '');
      setValue('apellidos', parsedData.apellidos || '');
      setValue('razonsocial', parsedData.razonsocial || '');
      setValue('ubicacion', parsedData.ubicacion || '');
      setValue('direccion', parsedData.direccion || '');
      setValue('email', parsedData.email || '');
      setValue('telefono', parsedData.telefono || '');
    }
  }, [initialData, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const { 
        documento, 
        nombre, 
        apellidos, 
        razonsocial, 
        ubicacion, 
        direccion, 
        email, 
        telefono 
      } = data;
      
      // Determine document type
      const tipo_doc = documento.length === 8 ? "DNI" : documento.length === 11 ? "RUC" : "Desconocido";
      const isDocumentoDNI = documento.length === 8;
      
      // Build backend-compatible object
      const destinatarioData = {
        // Use the appropriate fields based on document type
        dni: isDocumentoDNI ? documento : '',
        ruc: !isDocumentoDNI ? documento : '',
        nombres: isDocumentoDNI ? nombre : '',
        apellidos: isDocumentoDNI ? apellidos : '',
        razon_social: !isDocumentoDNI ? razonsocial : '',
        ubicacion,
        direccion,
        telefono,
        email
      };

      let result;
      if (initialData) {
        result = await updateDestinatario(initialData.id, destinatarioData);
      } else {
        result = await insertDestinatario(destinatarioData);
      }

      if (result) {
        toast.success("Destinatario guardado correctamente");
        onClose();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      toast.error("Error al gestionar el destinatario");
      console.error(error);
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
                  <IoMdClose className='text-3xl' />
                </button>
              </div>
              <div className='modal-body'>
                {/* Documento (DNI/RUC) - Always editable */}
                <div className='w-full relative group mb-5 text-start'>
                  <label className='text-sm font-bold text-black'>Documento:</label>
                  <input
                    {...register('documento', { required: true, minLength: 8, maxLength: 11 })}
                    type="text"
                    value={documento}
                    onChange={handleDocumentoChange}
                    className={`w-full bg-gray-50 ${errors.documento ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`}
                  />
                  {errors.documento && <span className="text-red-500 text-xs">Documento requerido (8-11 dígitos)</span>}
                </div>

                {/* Nombre y Apellidos (solo cuando es DNI) */}
                {isDNI && (
                  <>
                    <div className='grid grid-cols-2 gap-6'>
                      <div className='w-full relative group mb-5 text-start'>
                        <label className='text-sm font-bold text-black'>Nombre:</label>
                        <input
                          {...register('nombre', { required: isDNI })}
                          type="text"
                          disabled={isEditMode && !parsedInitialData.nombre}
                          placeholder={isEditMode && !parsedInitialData.nombre ? "No hay datos disponibles" : ""}
                          className={`w-full ${isEditMode && !parsedInitialData.nombre ? 'bg-gray-200 text-gray-500' : 'bg-gray-50'} ${errors.nombre ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} 
                        />
                        {errors.nombre && <span className="text-red-500 text-xs">Nombre requerido</span>}
                      </div>

                      <div className='w-full relative group mb-5 text-start'>
                        <label className='text-sm font-bold text-black'>Apellidos:</label>
                        <input
                          {...register('apellidos', { required: isDNI })}
                          type="text"
                          disabled={isEditMode && !parsedInitialData.apellidos}
                          placeholder={isEditMode && !parsedInitialData.apellidos ? "No hay datos disponibles" : ""}
                          className={`w-full ${isEditMode && !parsedInitialData.apellidos ? 'bg-gray-200 text-gray-500' : 'bg-gray-50'} ${errors.apellidos ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} 
                        />
                        {errors.apellidos && <span className="text-red-500 text-xs">Apellidos requeridos</span>}
                      </div>
                    </div>
                  </>
                )}

                {/* Razón Social (solo cuando es RUC) */}
                {isRUC && (
                  <div className='w-full relative group mb-5 text-start'>
                    <label className='text-sm font-bold text-black'>Razón Social:</label>
                    <input
                      {...register('razonsocial', { required: isRUC })}
                      type="text"
                      disabled={isEditMode && !parsedInitialData.razonsocial}
                      placeholder={isEditMode && !parsedInitialData.razonsocial ? "No hay datos disponibles" : ""}
                      className={`w-full ${isEditMode && !parsedInitialData.razonsocial ? 'bg-gray-200 text-gray-500' : 'bg-gray-50'} ${errors.razonsocial ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} 
                    />
                    {errors.razonsocial && <span className="text-red-500 text-xs">Razón Social requerida</span>}
                  </div>
                )}

                {/* Telefono y Ubicacion */}
                <div className='grid grid-cols-2 gap-6'>
                  <div className='w-full relative group mb-5 text-start'>
                    <label className='text-sm font-bold text-black'>Teléfono:</label>
                    <input
                      {...register('telefono')}
                      type="text"
                      disabled={isEditMode && !initialData.telefono}
                      placeholder={isEditMode && !initialData.telefono ? "No hay datos disponibles" : ""}
                      className={`w-full ${isEditMode && !initialData.telefono ? 'bg-gray-200 text-gray-500' : 'bg-gray-50'} ${errors.telefono ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} 
                    />
                  </div>

                  <div className='w-full relative group mb-5 text-start'>
                    <label className='text-sm font-bold text-black'>Ubicación:</label>
                    <input
                      {...register('ubicacion', { required: true })}
                      type="text"
                      disabled={isEditMode && !initialData.ubicacion}
                      placeholder={isEditMode && !initialData.ubicacion ? "No hay datos disponibles" : ""}
                      className={`w-full ${isEditMode && !initialData.ubicacion ? 'bg-gray-200 text-gray-500' : 'bg-gray-50'} ${errors.ubicacion ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} 
                    />
                    {errors.ubicacion && <span className="text-red-500 text-xs">Ubicación requerida</span>}
                  </div>
                </div>
                
                <div className='w-full relative group mb-5 text-start'>
                  <label className='text-sm font-bold text-black'>Dirección:</label>
                  <input
                    {...register('direccion')}
                    type="text"
                    disabled={isEditMode && !initialData.direccion}
                    placeholder={isEditMode && !initialData.direccion ? "No hay datos disponibles" : ""}
                    className={`w-full ${isEditMode && !initialData.direccion ? 'bg-gray-200 text-gray-500' : 'bg-gray-50'} ${errors.direccion ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} 
                  />
                </div>

                <div className='w-full relative group mb-5 text-start'>
                  <label className='text-sm font-bold text-black'>Email:</label>
                  <input
                    {...register('email')}
                    type="text"
                    disabled={isEditMode && !initialData.email}
                    placeholder={isEditMode && !initialData.email ? "No hay datos disponibles" : ""}
                    className={`w-full ${isEditMode && !initialData.email ? 'bg-gray-200 text-gray-500' : 'bg-gray-50'} ${errors.email ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} 
                  />
                </div>

                {/* Botones */}
                <div className='modal-buttons'>
                  <ButtonClose onClick={onClose} />
                  <ButtonSave type="submit" />
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