import { useState } from 'react';
import PropTypes from 'prop-types';
import { IoMdClose } from "react-icons/io";
import { FaRegPlusSquare } from "react-icons/fa";
import { Toaster, toast } from "react-hot-toast";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
import { ModalMarca } from './ModalForms/ModalMarca';
import { ModalLinea } from './ModalForms/ModalLinea';
import { ModalSublinea } from './ModalForms/ModalSubLinea';
import { useForm } from "react-hook-form";
import { addProducto } from '@/services/productos.services'; 

import './ProductosForm.css';

const ProductosForm = ({ modalTitle, onClose }) => {

    // Registro de producto
    const { register, handleSubmit, setValue, getValues, formState: {errors} } = useForm({
      defaultValues: {
        descripcion: '',
        id_marca: '',
        id_categoria: '',
        id_subcategoria: '',
        precio: '',
        cod_barras: '',
        undm: '',
        estado_producto: ''
      }
    });

    const onSubmit = handleSubmit(async (data) => {
      try {
        const { descripcion, id_marca, id_subcategoria, precio, cod_barras, undm, estado_producto } = data;
        const newProduct = {
          descripcion,
          id_marca: parseInt(id_marca),
          id_subcategoria: parseInt(id_subcategoria),
          precio: parseFloat(precio).toFixed(2), // Convertir el precio a formato numérico con dos decimales
          cod_barras: cod_barras === '' ? null : cod_barras,
          undm,
          estado_producto: parseInt(estado_producto)
        };
        console.log(newProduct);
        const result = await addProducto(newProduct);
        if (result) {
          onClose(); // Cerrar el modal después de añadir el producto
          setTimeout(() => {
            window.location.reload(); // Recargar la página después de 1 segundo
          }, 1000);
        }
      } catch (error) {
        toast.error("Error al añadir el producto");
        console.error(error);
      }
    })

    const [isModalOpenMarca, setIsModalOpenMarca] = useState(false);
    const [isModalOpenLinea, setIsModalOpenLinea] = useState(false);
    const [isModalOpenSubLinea, setIsModalOpenSubLinea] = useState(false);

    // Logica Modal Marca
    const handleModalMarca = () => {
      setIsModalOpenMarca(!isModalOpenMarca);
    };

    const handleModalLinea = () => {
      setIsModalOpenLinea(!isModalOpenLinea);
    };

    // Logica Modal Sublinea
    const handleModalSubLinea = () => {
      setIsModalOpenSubLinea(!isModalOpenSubLinea);
    };

    const handlePrice = (e) => {
      let newPrice = e.target.value;

      if (newPrice === '' || /^[0-9]*\.?[0-9]*$/.test(newPrice)) {
        setValue('precio', newPrice);
      }
    }
    
    const changePrice = () => {
      const price = parseFloat(getValues('precio'));
      if (!isNaN(price)) {
        setValue('precio', price.toFixed(2));
      }
    }

  return (
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
    
                <div className='w-full text-start mb-5'>
                  <label htmlFor="descripcion" className='text-sm font-bold text-black'>Descripción:</label>
                  <textarea 
                  {...register('descripcion', 
                    { required: true }
                  )}
                  name="descripcion" 
                  id="descripcion"
                  rows={4} 
                  className={`block w-full text-sm border rounded-lg resize-none ${errors.descripcion ? 'border-red-600' : 'border-gray-300'} bg-gray-50 text-gray-900`}
                  ></textarea>
                </div>
    
                {/* Segunda Fila */}
    
                <div className='grid grid-cols-2 gap-6'>
                  <div className='w-full relative group mb-5 text-start'>
                    <label htmlFor="linea" className='text-sm font-bold text-black'>Línea:</label>
                    <div className='flex justify-center items-center gap-2'>
                      <select 
                      {...register('id_categoria', 
                        { required: true }
                      )}
                      id='linea'
                      name='id_categoria'
                      className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                        <option value="">Seleccione...</option>
                        <option value="1">Producto</option>
                      </select>
                      <FaRegPlusSquare className='text-2xl cursor-pointer text-gray-500' onClick={handleModalLinea} />
                    </div>
                    
                  </div>
                  <div className='w-full relative group mb-5 text-start'>
                    <label htmlFor="Sub-Línea" className='text-sm font-bold text-black'>Sub-Línea:</label>
                    <div className='flex justify-center items-center gap-2'>
                      <select 
                      {...register('id_subcategoria', 
                        { required: true }
                      )}
                      id='sublinea'
                      name='id_subcategoria'
                      className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                        <option value="">Seleccione...</option>
                        <option value="1">Pantalón</option>
                      </select>
                      <FaRegPlusSquare className='text-2xl cursor-pointer text-gray-500' onClick={handleModalSubLinea} />
                    </div>
                  </div>
                </div>
    
                {/* Tercera Fila */}
    
                <div className='grid grid-cols-2 gap-6'>
                  <div className='w-full relative group mb-5 text-start'>
                    <label htmlFor="Sub-Línea" className='text-sm font-bold text-black'>Marca:</label>
                      <div className='flex justify-center items-center gap-2'>
                        <select 
                        {...register('id_marca', 
                          { required: true }
                        )}
                        id='marca' 
                        name='id_marca'
                        className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                          <option value="">Seleccione...</option>
                          <option value="1">Tormenta</option>
                        </select>
                        <FaRegPlusSquare className='text-2xl cursor-pointer text-gray-500' onClick={handleModalMarca} />
                      </div>
                  </div>
                  <div className='w-full relative group mb-5 text-start'>
                    <label htmlFor="precio" className='text-sm font-bold text-black'>Precio:</label>
                    <input 
                    {...register('precio', 
                      { required: true }
                    )}
                    type="number"
                    onChange={handlePrice}
                    onBlur={changePrice}
                    min={0}
                    step={0.01}
                    name='precio'
                    placeholder='89.99'
                    className='w-full bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-1.5' />
                  </div>
                </div>
    
                {/* Cuarta Fila */}
    
                <div className='grid grid-cols-2 gap-6'>
                  <div className='w-full relative group mb-5 text-start'>
                    <label htmlFor="unidadMedida" className='text-sm font-bold text-black'>Und. Medida:</label>
                    <select 
                    {...register('undm', 
                      { required: true }
                    )}
                    id='unidadMedida' 
                    name='undm'
                    className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                        <option value="">Seleccione...</option>
                        <option value="KGM">KGM</option>
                        <option value="NIU">NIU</option>
                    </select>
                  </div>
                  <div className='w-full relative group mb-5 text-start'>
                    <label htmlFor="estado" className='text-sm font-bold text-black'>Estado:</label>
                    <select 
                    {...register('estado_producto', 
                      { required: true }
                    )}
                    id='estado'
                    name='estado_producto'
                    className='w-full text-sm bg-gray-50 border-gray-300 text-gray-900 rounded-lg border p-2'>
                      <option value="">Seleccione...</option>
                      <option value={1} >Activo</option>
                      <option value={0} >Inactivo</option>
                    </select>
                  </div>
                </div>
    
                {/* Final de Fila */}

                <div>
                  <input
                  {...register('cod_barras', 
                    { required: false }
                  )}
                  type="text"
                  name="cod_barras"
                  disabled
                  hidden />
                </div>
    
                <div className='modal-buttons'>
                  <ButtonClose onClick={onClose}/>
                  <ButtonSave type="submit"/>
                </div>
            </div>
          </div>
        </div>
  
        {/* Modal de Nueva Marca */}
        {isModalOpenMarca && (
          <ModalMarca modalTitle={'Marca'} closeModel={handleModalMarca} />
        )}
  
        {/* Modal de Nueva Linea */}
        {isModalOpenLinea && (
          <ModalLinea modalTitle={'Linea'} closeModel={handleModalLinea} />
        )}
  
        {/* Modal de Nueva SubLinea */}
        {isModalOpenSubLinea && (
          <ModalSublinea modalTitle={'Sub-Línea'} closeModel={handleModalSubLinea} />
        )}
  
      </div>
    </form>
  );
};

ProductosForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ProductosForm;
