/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaPlus } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { ModalMarca } from './ModalForms/ModalMarca';
import { ModalCategoria } from './ModalForms/ModalCategoria';
import { ModalSubCategoria } from './ModalForms/ModalSubCategoria';
import { useForm, Controller } from "react-hook-form";
import { useCategorias } from '@/context/Categoria/CategoriaProvider';
import { useMarcas } from '@/context/Marca/MarcaProvider';
import { useSubcategorias } from '@/context/Subcategoria/SubcategoriaProvider';
import { addProducto, updateProducto, getLastIdProducto } from '@/services/productos.services';
import {
  Textarea,
  Input,
  Button,
  ButtonGroup
} from "@heroui/react";
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem
} from '@heroui/react';

const ProductosForm = ({ modalTitle, onClose, initialData, onSuccess }) => {

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

  // Adaptar initialData para selects (convertir a string)
  const adaptInitialData = (data) => {
    if (!data) return undefined;
    // Adaptar estado_producto a "1" o "0" siempre
    let estadoAdaptado = "";
    if (data.estado_producto === 1 || data.estado_producto === "1" || data.estado_producto === "Activo") {
      estadoAdaptado = "1";
    } else if (data.estado_producto === 0 || data.estado_producto === "0" || data.estado_producto === "Inactivo") {
      estadoAdaptado = "0";
    } else {
      estadoAdaptado = ""; // Por si acaso
    }
    return {
      ...data,
      id_categoria: data.id_categoria ? String(data.id_categoria) : '',
      id_subcategoria: data.id_subcategoria ? String(data.id_subcategoria) : '',
      id_marca: data.id_marca ? String(data.id_marca) : '',
      estado_producto: estadoAdaptado,
    };
  };

  // Registro de producto
  const { control, handleSubmit, setValue, getValues, watch, reset, formState: { errors } } = useForm({
    defaultValues: adaptInitialData(initialData) || {
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
      reset(adaptInitialData(initialData)); // Usa los valores como string
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
          //console.error("Error generating barcode");
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
      let productoResult = null;
      if (initialData) {
        result = await updateProducto(initialData.id_producto, newProduct);
        if (result) {
          productoResult = {
            ...initialData,
            ...newProduct,
            id_producto: initialData.id_producto
          };
        }
      } else {
        result = await addProducto(newProduct);
        if (result && result.success) {
          // Busca los nombres para mostrar en la tabla
          const marca = marcas.find(m => m.id_marca === parseInt(id_marca));
          const subcat = subcategorias.find(s => s.id_subcategoria === parseInt(id_subcategoria));
          const categoria = categorias.find(c => c.id_categoria === (subcat ? subcat.id_categoria : null));
          productoResult = {
            ...newProduct,
            id_producto: result[1],
            nom_marca: marca ? marca.nom_marca : '',
            nom_subcat: subcat ? subcat.nom_subcat : '',
            id_categoria: categoria ? categoria.id_categoria : '',
            estado_producto: estado_producto === "1" ? "Activo" : "Inactivo"
          };
        }
      }
      if (productoResult && result) {
        toast.success(initialData ? "Producto actualizado correctamente" : "Producto creado correctamente");
        if (onSuccess) onSuccess(productoResult);
        handleCloseModal();
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

  // Función para manejar el cierre del modal sin afectar al modal padre
  const handleModalOnClose = () => {
    // Solo cierra este modal, no propaga el evento al modal padre
    handleCloseModal();
  };

  return (
    <div>
      <Modal
        isOpen={isOpen}
        onClose={handleModalOnClose}
        size="3xl"
        scrollBehavior="inside"
        backdrop="blur"
        isDismissable={true}
        isKeyboardDismissDisabled={false}
        classNames={{
          backdrop: "bg-slate-900/40 backdrop-blur-md z-[10005]",
          wrapper: "z-[10006]",
          base: "z-[10007] rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl",
          header: "border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/20 py-4 px-6",
          body: "py-6 px-6",
          footer: "border-t border-slate-100 dark:border-zinc-800 py-4 px-6 bg-slate-50/30 dark:bg-zinc-900/10"
        }}
        motionProps={{
          variants: {
            enter: { y: 0, opacity: 1, scale: 1 },
            exit: { y: 10, opacity: 0, scale: 0.98 }
          }
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span className="text-xl font-bold text-slate-800 dark:text-white">{modalTitle}</span>
              </ModalHeader>
              <ModalBody>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-6">
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
                            variant="flat"
                            labelPlacement="outside"
                            classNames={{
                              inputWrapper: "bg-slate-100 dark:bg-zinc-800 shadow-none hover:bg-slate-200/50 dark:hover:bg-zinc-700 transition-colors",
                              input: "text-slate-800 dark:text-slate-200",
                              label: "text-slate-600 dark:text-slate-400 font-semibold mb-2"
                            }}
                            color={errors.descripcion ? "danger" : "default"}
                            errorMessage={errors.descripcion?.message}
                            isRequired
                            rows={3}
                          />
                        )}
                      />
                    </div>

                    {/* Categoría y Subcategoría */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                                variant="flat"
                                labelPlacement="outside"
                                classNames={{
                                  trigger: "bg-slate-100 dark:bg-zinc-800 shadow-none hover:bg-slate-200/50 dark:hover:bg-zinc-700 transition-colors",
                                  value: "text-slate-800 dark:text-slate-200",
                                  label: "text-slate-600 dark:text-slate-400 font-semibold mb-2"
                                }}
                                color={errors.id_categoria ? "danger" : "default"}
                                errorMessage={errors.id_categoria?.message}
                                isRequired
                                className="flex-1"
                                selectedKeys={field.value ? [field.value] : []}
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
                          <Button isIconOnly variant="flat" onPress={handleModalCategoria} className="mt-6 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                            <FaPlus className="text-sm" />
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
                                variant="flat"
                                labelPlacement="outside"
                                classNames={{
                                  trigger: "bg-slate-100 dark:bg-zinc-800 shadow-none hover:bg-slate-200/50 dark:hover:bg-zinc-700 transition-colors",
                                  value: "text-slate-800 dark:text-slate-200",
                                  label: "text-slate-600 dark:text-slate-400 font-semibold mb-2"
                                }}
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
                          <Button isIconOnly variant="flat" onPress={handleModalSubCategoria} className="mt-6 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                            <FaPlus className="text-sm" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Marca y Precio */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                                variant="flat"
                                labelPlacement="outside"
                                classNames={{
                                  trigger: "bg-slate-100 dark:bg-zinc-800 shadow-none hover:bg-slate-200/50 dark:hover:bg-zinc-700 transition-colors",
                                  value: "text-slate-800 dark:text-slate-200",
                                  label: "text-slate-600 dark:text-slate-400 font-semibold mb-2"
                                }}
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
                          <Button isIconOnly variant="flat" onPress={handleModalMarca} className="mt-6 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">
                            <FaPlus className="text-sm" />
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
                              placeholder="0.00"
                              variant="flat"
                              labelPlacement="outside"
                              classNames={{
                                inputWrapper: "bg-slate-100 dark:bg-zinc-800 shadow-none hover:bg-slate-200/50 dark:hover:bg-zinc-700 transition-colors",
                                input: "text-slate-800 dark:text-slate-200",
                                label: "text-slate-600 dark:text-slate-400 font-semibold mb-2"
                              }}
                              color={errors.precio ? "danger" : "default"}
                              errorMessage={errors.precio?.message}
                              isRequired
                              type="number"
                              min={0}
                              step={0.01}
                              startContent={<span className="text-slate-400">S/.</span>}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex flex-col space-y-2">
                        <Controller
                          name="undm"
                          control={control}
                          rules={{ required: "La unidad de medida es requerida" }}
                          render={({ field }) => (
                            <Select
                              {...field}
                              label="Unidad de Medida"
                              placeholder="Seleccione unidad"
                              variant="flat"
                              labelPlacement="outside"
                              classNames={{
                                trigger: "bg-slate-100 dark:bg-zinc-800 shadow-none hover:bg-slate-200/50 dark:hover:bg-zinc-700 transition-colors",
                                value: "text-slate-800 dark:text-slate-200",
                                label: "text-slate-600 dark:text-slate-400 font-semibold mb-2"
                              }}
                              color={errors.undm ? "danger" : "default"}
                              errorMessage={errors.undm?.message}
                              isRequired
                              selectedKeys={field.value ? [field.value.toString()] : []}
                              onChange={(e) => field.onChange(e.target.value)}
                            >
                              <SelectItem key="KGM" value="KGM">KGM</SelectItem>
                              <SelectItem key="NIU" value="NIU">NIU</SelectItem>
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
                              placeholder="Seleccione estado"
                              variant="flat"
                              labelPlacement="outside"
                              classNames={{
                                trigger: "bg-slate-100 dark:bg-zinc-800 shadow-none hover:bg-slate-200/50 dark:hover:bg-zinc-700 transition-colors",
                                value: "text-slate-800 dark:text-slate-200",
                                label: "text-slate-600 dark:text-slate-400 font-semibold mb-2"
                              }}
                              color={errors.estado_producto ? "danger" : "default"}
                              errorMessage={errors.estado_producto?.message}
                              isRequired
                              selectedKeys={field.value ? [field.value.toString()] : []}
                              onChange={(e) => field.onChange(e.target.value)}
                            >
                              <SelectItem key="1" value="1">Activo</SelectItem>
                              <SelectItem key="0" value="0">Inactivo</SelectItem>
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
                  <ModalFooter className="flex justify-end gap-3 mt-6">
                    <ButtonClose onPress={handleCloseModal} />
                    <ButtonSave type="submit" />
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
  initialData: PropTypes.object,
  onSuccess: PropTypes.func
};

export default ProductosForm;