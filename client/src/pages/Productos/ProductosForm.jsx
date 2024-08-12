/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { IoMdClose } from "react-icons/io";
import { FaRegPlusSquare } from "react-icons/fa";
import { Toaster, toast } from "react-hot-toast";
import { ButtonSave, ButtonClose } from '@/components/Buttons/Buttons';
import { ModalMarca } from './ModalForms/ModalMarca';
import { ModalCategoria } from './ModalForms/ModalCategoria';
import { ModalSubCategoria } from './ModalForms/ModalSubCategoria';
import { useForm } from "react-hook-form";
import { useCategorias } from '@/context/Categoria/CategoriaProvider';
import { useMarcas } from '@/context/Marca/MarcaProvider';
import { useSubcategorias } from '@/context/Subcategoria/SubcategoriaProvider';
import { addProducto, updateProducto, getLastIdProducto } from '@/services/productos.services'; 
import './ProductosForm.css';

const ProductosForm = ({ modalTitle, onClose, initialData  }) => {

    // Consumir context de categorias, subcategorias y marcas
    const { categorias, loadCategorias } = useCategorias();
    const { marcas, loadMarcas } = useMarcas();
    const { subcategorias, loadSubcategorias } = useSubcategorias();
    useEffect(() => {
      loadCategorias();
      loadMarcas();
      loadSubcategorias();
    }, []);

    // Estado para subcategorías filtradas
    const [filteredSubcategorias, setFilteredSubcategorias] = useState([]);

    // Registro de producto
    const { register, handleSubmit, setValue, getValues, watch, reset, formState: {errors} } = useForm({
      defaultValues: initialData?.data || {
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

    // Cargar subcategorias al seleccionar una categoría
    const idCategoria = watch('id_categoria');

    useEffect(() => {
      // Filtrar subcategorías basadas en la categoría seleccionada
      if (idCategoria) {
        const filtered = subcategorias.filter(subcategoria => subcategoria.id_categoria === parseInt(idCategoria));
        setFilteredSubcategorias(filtered);
      } else {
        setFilteredSubcategorias([]);
      }
    }, [idCategoria, subcategorias]);

    useEffect(() => {
      if (initialData && categorias.length > 0 && marcas.length > 0 && subcategorias.length > 0) {
        reset(initialData.data);
      }
    }, [initialData, marcas, categorias, subcategorias, reset]);

    // Generar barcode de productos
    useEffect(() => {
      const generateBarcode = async () => {
        if (!initialData) {
          try {
            const lastId = await getLastIdProducto();
            const barcode = `P${lastId.toString().padStart(11, '0')}`;
            setValue('cod_barras', barcode);
          } catch (error) {
            console.error("Error generating barcode:", error);
          }
        }
      };
      generateBarcode();
    }, [initialData, setValue]);

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

        let result;
        if (initialData) {
          result = await updateProducto(initialData?.id_producto,newProduct); // Llamada a la API para añadir el producto
        } else {
          result = await addProducto(newProduct); // Llamada a la API para añadir el producto
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

    const [isModalOpenMarca, setIsModalOpenMarca] = useState(false);
    const [isModalOpenCategoria, setIsModalOpenCategoria] = useState(false);
    const [isModalOpenSubCategoria, setIsModalOpenSubCategorias] = useState(false);

    // Logica Modal Marca
    const handleModalMarca = () => {
      setIsModalOpenMarca(!isModalOpenMarca);   
    };

    const handleModalCategoria = () => {
      setIsModalOpenCategoria(!isModalOpenCategoria);
    };

    // Logica Modal Sublinea
    const handleModalSubCategoria = () => {
      setIsModalOpenSubCategorias(!isModalOpenSubCategoria);
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
      
                  <div className='w-full text-start mb-5'>
                    <label htmlFor="descripcion" className='text-sm font-bold text-black'>Descripción:</label>
                    <textarea 
                    {...register('descripcion', 
                      { required: true }
                    )}
                    name="descripcion" 
                    rows={4} 
                    className={`block w-full text-sm border rounded-lg resize-none ${errors.descripcion ? 'border-red-600 focus:border-red-600 focus:ring-red-600' : 'border-gray-300'} bg-gray-50 text-gray-900`}
                    ></textarea>
                  </div>
      
                  {/* Segunda Fila */}
      
                  <div className='grid grid-cols-2 gap-6'>
                    <div className='w-full relative group mb-5 text-start'>
                      <label htmlFor="linea" className='text-sm font-bold text-black'>Categoría:</label>
                      <div className='flex justify-center items-center gap-2'>
                        <select 
                        {...register('id_categoria', 
                          { required: true }
                        )}
                        name='id_categoria'
                        className={`w-full text-sm bg-gray-50 ${errors.id_categoria ? 'border-red-600 focus:border-red-600 focus:ring-red-600 text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-2`}>
                          <option value="">Seleccione...</option>
                          {categorias.length > 0 && categorias.map((categoria, index) => (
                            <option key={index} value={categoria.id_categoria}>
                              {categoria.nom_categoria.toUpperCase()}
                            </option>
                          ))}
                        </select>
                        <FaRegPlusSquare className='text-2xl cursor-pointer text-gray-500' onClick={handleModalCategoria} />
                      </div>
                      
                    </div>
                    <div className='w-full relative group mb-5 text-start'>
                      <label htmlFor="Sub-Línea" className='text-sm font-bold text-black'>Sub-Categoría:</label>
                      <div className='flex justify-center items-center gap-2'>
                        <select 
                        {...register('id_subcategoria', 
                          { required: true }
                        )}
                        name='id_subcategoria'
                        className={`w-full text-sm bg-gray-50 ${errors.id_subcategoria ? 'border-red-600 focus:border-red-600 focus:ring-red-600 text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-2`}>
                          <option value="">Seleccione...</option>
                          {filteredSubcategorias.length > 0 && filteredSubcategorias.map((subcategoria, index) => (
                            <option key={index} value={subcategoria.id_subcategoria}>
                              {subcategoria.nom_subcat.toUpperCase()}
                            </option>
                          ))}
                        </select>
                        <FaRegPlusSquare className='text-2xl cursor-pointer text-gray-500' onClick={handleModalSubCategoria} />
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
                          name='id_marca'
                          className={`w-full text-sm bg-gray-50 ${errors.id_marca ? 'border-red-600 focus:border-red-600 focus:ring-red-600 text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-2`}>
                            <option value="">Seleccione...</option>
                            {marcas.length > 0 && marcas.map((marca, index) => (
                              <option key={index} value={marca.id_marca}>
                                {marca.nom_marca.toUpperCase()}
                              </option>
                            ))}
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
                      className={`w-full bg-gray-50 ${errors.precio ? 'border-red-600 focus:border-red-600 focus:ring-red-600 placeholder:text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-1.5`} />
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
                      name='undm'
                      className={`w-full text-sm bg-gray-50 ${errors.undm ? 'border-red-600 focus:border-red-600 focus:ring-red-600 text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-2`}>
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
                      name='estado_producto'
                      className={`w-full text-sm bg-gray-50 ${errors.estado_producto ? 'border-red-600 focus:border-red-600 focus:ring-red-600 text-red-500' : 'border-gray-300'} text-gray-900 rounded-lg border p-2`}>
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
        </div>
      </form>
          {/* Modal de Nueva Marca */}
          {isModalOpenMarca && (
            <ModalMarca modalTitle={'Marca'} closeModel={handleModalMarca} />
          )}
    
          {/* Modal de Nueva Linea */}
          {isModalOpenCategoria && (
            <ModalCategoria modalTitle={'Categoría'} closeModel={handleModalCategoria} />
          )}
    
          {/* Modal de Nueva SubLinea */}
          {isModalOpenSubCategoria && (
            <ModalSubCategoria modalTitle={'Sub-Categoría'} closeModel={handleModalSubCategoria} />
          )}
    </div>
  );
};

ProductosForm.propTypes = {
  modalTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.object
};

export default ProductosForm;