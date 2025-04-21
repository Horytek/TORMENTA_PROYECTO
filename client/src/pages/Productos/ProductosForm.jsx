/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaPlus } from "react-icons/fa";
import { Toaster, toast } from "react-hot-toast";
import { ModalMarca } from './ModalForms/ModalMarca';
import { ModalCategoria } from './ModalForms/ModalCategoria';
import { ModalSubCategoria } from './ModalForms/ModalSubCategoria';
import { useForm, Controller } from "react-hook-form";
import { useCategorias } from '@/context/Categoria/CategoriaProvider';
import { useMarcas } from '@/context/Marca/MarcaProvider';
import { useSubcategorias } from '@/context/Subcategoria/SubcategoriaProvider';
import { addProducto, updateProducto, getLastIdProducto } from '@/services/productos.services'; 
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Textarea,
  Input,
  Select,
  SelectItem,
  Button,
  ButtonGroup
} from "@nextui-org/react";

const ProductosForm = ({ modalTitle, onClose, initialData }) => {
    // Consumir context de categorias, subcategorias y marcas
    const { categorias, loadCategorias } = useCategorias();
    const { marcas, loadMarcas } = useMarcas();
    const { subcategorias, loadSubcategorias } = useSubcategorias();
    const [isOpen, setIsOpen] = useState(true);
    
    useEffect(() => {
      loadCategorias();
      loadMarcas();
      loadSubcategorias();
    }, []);

    // Estado para subcategorías filtradas
    const [filteredSubcategorias, setFilteredSubcategorias] = useState([]);

    // Registro de producto
    const { control, handleSubmit, setValue, getValues, watch, reset, formState: { errors } } = useForm({
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

    const onSubmit = async (data) => {
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
          result = await updateProducto(initialData?.id_producto, newProduct); 
        } else {
          result = await addProducto(newProduct);
        }
        
        // Cerrar modal y recargar la página
        if (result) {
          toast.success(initialData ? "Producto actualizado correctamente" : "Producto creado correctamente");
          handleCloseModal();
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }

      } catch (error) {
        toast.error("Error al realizar la gestión del producto");
      }
    };

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

    const handleCloseModal = () => {
      setIsOpen(false);
      setTimeout(() => {
        onClose();
      }, 300);
    };

  return (
    <div>
      <Toaster />
      <Modal 
        isOpen={isOpen} 
        onClose={handleCloseModal}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {modalTitle}
              </ModalHeader>
              <ModalBody>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-5">
                    {/* Descripción */}
                    <div className="w-full">
                      <Controller
                        name="descripcion"
                        control={control}
                        rules={{ required: "La descripción es requerida" }}
                        render={({ field }) => (
                          <Textarea
                            {...field}
                            label="Descripción"
                            placeholder="Ingrese la descripción del producto"
                            variant="bordered"
                            color={errors.descripcion ? "danger" : "default"}
                            errorMessage={errors.descripcion?.message}
                            isRequired
                            rows={4}
                          />
                        )}
                      />
                    </div>

                    {/* Categoría y Subcategoría */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center gap-2">
                          <Controller
                            name="id_categoria"
                            control={control}
                            rules={{ required: "La categoría es requerida" }}
                            render={({ field }) => (
                              <Select
                                {...field}
                                label="Categoría"
                                placeholder="Seleccione una categoría"
                                variant="bordered"
                                color={errors.id_categoria ? "danger" : "default"}
                                errorMessage={errors.id_categoria?.message}
                                isRequired
                                className="flex-1"
                                selectedKeys={field.value ? [field.value.toString()] : []}
                                onChange={(e) => field.onChange(e.target.value)}
                              >
                                {categorias.map((categoria) => (
                                  <SelectItem key={categoria.id_categoria.toString()} value={categoria.id_categoria.toString()}>
                                    {categoria.nom_categoria.toUpperCase()}
                                  </SelectItem>
                                ))}
                              </Select>
                            )}
                          />
                          <Button isIconOnly variant="light" onPress={handleModalCategoria} aria-label="Agregar categoría">
                            <FaPlus className="text-gray-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center gap-2">
                          <Controller
                            name="id_subcategoria"
                            control={control}
                            rules={{ required: "La subcategoría es requerida" }}
                            render={({ field }) => (
                              <Select
                                {...field}
                                label="Subcategoría"
                                placeholder="Seleccione una subcategoría"
                                variant="bordered"
                                color={errors.id_subcategoria ? "danger" : "default"}
                                errorMessage={errors.id_subcategoria?.message}
                                isRequired
                                className="flex-1"
                                selectedKeys={field.value ? [field.value.toString()] : []}
                                onChange={(e) => field.onChange(e.target.value)}
                                isDisabled={!idCategoria}
                              >
                                {filteredSubcategorias.map((subcategoria) => (
                                  <SelectItem key={subcategoria.id_subcategoria.toString()} value={subcategoria.id_subcategoria.toString()}>
                                    {subcategoria.nom_subcat.toUpperCase()}
                                  </SelectItem>
                                ))}
                              </Select>
                            )}
                          />
                          <Button isIconOnly variant="light" onPress={handleModalSubCategoria} aria-label="Agregar subcategoría">
                            <FaPlus className="text-gray-500" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Marca y Precio */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center gap-2">
                          <Controller
                            name="id_marca"
                            control={control}
                            rules={{ required: "La marca es requerida" }}
                            render={({ field }) => (
                              <Select
                                {...field}
                                label="Marca"
                                placeholder="Seleccione una marca"
                                variant="bordered"
                                color={errors.id_marca ? "danger" : "default"}
                                errorMessage={errors.id_marca?.message}
                                isRequired
                                className="flex-1"
                                selectedKeys={field.value ? [field.value.toString()] : []}
                                onChange={(e) => field.onChange(e.target.value)}
                              >
                                {marcas.map((marca) => (
                                  <SelectItem key={marca.id_marca.toString()} value={marca.id_marca.toString()}>
                                    {marca.nom_marca.toUpperCase()}
                                  </SelectItem>
                                ))}
                              </Select>
                            )}
                          />
                          <Button isIconOnly variant="light" onPress={handleModalMarca} aria-label="Agregar marca">
                            <FaPlus className="text-gray-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Controller
                          name="precio"
                          control={control}
                          rules={{ required: "El precio es requerido" }}
                          render={({ field }) => (
                            <Input
                              {...field}
                              label="Precio"
                              placeholder="Ingrese el precio del producto"
                              variant="bordered"
                              color={errors.precio ? "danger" : "default"}
                              errorMessage={errors.precio?.message}
                              isRequired
                              type="number"
                              min={0}
                              step={0.01}
                              onChange={(e) => {
                                handlePrice(e);
                                field.onChange(e.target.value);
                              }}
                              onBlur={changePrice}
                            />
                          )}
                        />
                      </div>
                    </div>

                    {/* Unidad de Medida y Estado */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-2">
                        <Controller
                          name="undm"
                          control={control}
                          rules={{ required: "La unidad de medida es requerida" }}
                          render={({ field }) => (
                            <Select
                              {...field}
                              label="Unidad de Medida"
                              placeholder="Seleccione una unidad de medida"
                              variant="bordered"
                              color={errors.undm ? "danger" : "default"}
                              errorMessage={errors.undm?.message}
                              isRequired
                              selectedKeys={field.value ? [field.value.toString()] : []}
                              onChange={(e) => field.onChange(e.target.value)}
                            >
                              <SelectItem value="KGM">KGM</SelectItem>
                              <SelectItem value="NIU">NIU</SelectItem>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Controller
                          name="estado_producto"
                          control={control}
                          rules={{ required: "El estado es requerido" }}
                          render={({ field }) => (
                            <Select
                              {...field}
                              label="Estado"
                              placeholder="Seleccione el estado del producto"
                              variant="bordered"
                              color={errors.estado_producto ? "danger" : "default"}
                              errorMessage={errors.estado_producto?.message}
                              isRequired
                              selectedKeys={field.value ? [field.value.toString()] : []}
                              onChange={(e) => field.onChange(e.target.value)}
                            >
                              <SelectItem value="1">Activo</SelectItem>
                              <SelectItem value="0">Inactivo</SelectItem>
                            </Select>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    name="cod_barras"
                    hidden
                    disabled
                  />
                  <ModalFooter>
                    <ButtonGroup>
                      <Button variant="light" onPress={handleCloseModal}>
                        Cancelar
                      </Button>
                      <Button type="submit" color="primary">
                        Guardar
                      </Button>
                    </ButtonGroup>
                  </ModalFooter>
                </form>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
      {/* Modal de Nueva Marca */}
      {isModalOpenMarca && (
        <ModalMarca modalTitle={'Marca'} closeModel={handleModalMarca} />
      )}
      {/* Modal de Nueva Categoría */}
      {isModalOpenCategoria && (
        <ModalCategoria modalTitle={'Categoría'} closeModel={handleModalCategoria} />
      )}
      {/* Modal de Nueva SubCategoría */}
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