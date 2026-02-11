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
import { addProducto, updateProducto, getLastIdProducto, generateSKUs, getProductAttributes } from '@/services/productos.services';
import { getCategoryAttributes, getAttributeValues } from '@/services/attributes.services'; // NEW Services
import { getUnidades } from '@/services/unidades.services';
import { useUserStore } from '@/store/useStore';

import {
  Textarea,
  Input,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  CheckboxGroup,
  Checkbox,
  Divider,
  ScrollShadow,
  Chip
} from "@heroui/react";
import { ButtonSave, ButtonClose } from "@/components/Buttons/Buttons";

const ProductosForm = ({ modalTitle, onClose, initialData, onSuccess }) => {

  // Consumir context de categorias, subcategorias y marcas
  const { categorias, loadCategorias } = useCategorias();
  const { marcas, loadMarcas } = useMarcas();
  const { subcategorias, loadSubcategorias } = useSubcategorias();

  // Control de Modales
  const [isOpen, setIsOpen] = useState(true);
  const [isModalOpenMarca, setIsModalOpenMarca] = useState(false);
  const [isModalOpenCategoria, setIsModalOpenCategoria] = useState(false);
  const [isModalOpenSubCategoria, setIsModalOpenSubCategorias] = useState(false);

  // --- Dynamic Attributes State ---
  const [categoryAttrs, setCategoryAttrs] = useState([]); // [{id_atributo, nombre, values: []}]
  const [selectedAttrs, setSelectedAttrs] = useState({}); // { [id_atributo]: [id_valor1, id_valor2] }
  const [loadingAttrs, setLoadingAttrs] = useState(false);

  // Carga inicial de datos externos
  const [unidadesList, setUnidadesList] = useState([]);

  useEffect(() => {
    loadCategorias();
    loadMarcas();
    loadSubcategorias();

    // Load Unidades
    getUnidades().then(data => {
      const activeUnidades = (data || []).filter(u => u.estado === 1 || u.estado === '1');
      setUnidadesList(activeUnidades);
    });
  }, []);

  // Adaptar initialData para selects (convertir a string)
  const adaptInitialData = (data) => {
    if (!data) return undefined;

    let estadoAdaptado = "";
    if (data.estado_producto === 1 || data.estado_producto === "1" || data.estado_producto === "Activo") {
      estadoAdaptado = "1";
    } else if (data.estado_producto === 0 || data.estado_producto === "0" || data.estado_producto === "Inactivo") {
      estadoAdaptado = "0";
    }

    return {
      ...data,
      id_categoria: data.id_categoria ? String(data.id_categoria) : '',
      id_subcategoria: data.id_subcategoria ? String(data.id_subcategoria) : '',
      id_marca: data.id_marca ? String(data.id_marca) : '',
      estado_producto: estadoAdaptado,
    };
  };

  const { control, handleSubmit, setValue, getValues, watch, reset, formState: { errors } } = useForm({
    defaultValues: adaptInitialData(initialData) || {
      descripcion: '',
      id_marca: '',
      id_categoria: '',
      id_subcategoria: '',
      precio: '',
      cod_barras: '',
      undm: '',
      estado_producto: '1'
    }
  });

  const idCategoria = watch('id_categoria');

  // --- Filter Subcategories ---
  const [filteredSubcategorias, setFilteredSubcategorias] = useState([]);
  useEffect(() => {
    if (idCategoria) {
      const filtered = subcategorias.filter(subcategoria => subcategoria.id_categoria === parseInt(idCategoria));
      setFilteredSubcategorias(filtered);

      // Load Attributes for this Category
      loadCategoryAttributes(idCategoria);
    } else {
      setFilteredSubcategorias([]);
      setCategoryAttrs([]);
    }
  }, [idCategoria, subcategorias]);

  // --- Load Attributes Logic ---
  const loadCategoryAttributes = async (catId) => {
    setLoadingAttrs(true);
    try {
      const attrs = await getCategoryAttributes(catId); // Returns [{id_atributo, nombre, tipo_input, ...}]

      // Parallel fetch of values for each attribute
      const attrsWithValues = await Promise.all(attrs.map(async (a) => {
        const vals = await getAttributeValues(a.id_atributo);
        return { ...a, values: vals || [] };
      }));

      setCategoryAttrs(attrsWithValues);
    } catch (e) {
      console.error("Error loading category attributes", e);
    } finally {
      setLoadingAttrs(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      reset(adaptInitialData(initialData));
    }
  }, [initialData, reset]);

  // --- Load Active Variants (Edit Mode) ---
  useEffect(() => {
    const loadVariants = async () => {
      if (initialData?.id_producto) {
        try {
          const attrsData = await getProductAttributes(initialData.id_producto);
          // Backend now returns { attributes: [{ id_atributo, values: [{ id, valor }] }] }
          if (attrsData && attrsData.attributes) {
            const preSelected = {};
            attrsData.attributes.forEach(attr => {
              if (attr.values && attr.values.length > 0) {
                preSelected[attr.id_atributo] = attr.values.map(v => String(v.id));
              }
            });
            setSelectedAttrs(preSelected);
          }
        } catch (error) {
          console.error("Error loading active variants:", error);
        }
      }
    };
    loadVariants();
  }, [initialData]);

  // Generar barcode de productos
  useEffect(() => {
    const generateBarcode = async () => {
      if (!initialData) {
        try {
          const lastId = await getLastIdProducto();
          // Use user's id_tenant from store if available, otherwise default to simple format (risky but fallback)
          const state = useUserStore.getState();
          const tenantPrefix = state.id_tenant ? `T${state.id_tenant}-` : '';

          const barcode = `${tenantPrefix}P${lastId ? lastId.toString().padStart(8, '0') : '00000001'}`;
          setValue('cod_barras', barcode);
        } catch (error) { /* ignore */ }
      }
    };
    generateBarcode();
  }, [initialData, setValue]);

  // --- Submit ---
  const onSubmit = async (data) => {
    try {
      // 1. Guardar/Actualizar Producto
      const { descripcion, id_marca, id_subcategoria, precio, cod_barras, undm, estado_producto } = data;
      const newProduct = {
        descripcion,
        id_marca: parseInt(id_marca),
        id_subcategoria: parseInt(id_subcategoria),
        precio: parseFloat(precio).toFixed(2),
        cod_barras: cod_barras === '' ? null : cod_barras,
        undm,
        estado_producto: parseInt(estado_producto)
      };

      let result;
      let productoId = null;

      if (initialData) {
        result = await updateProducto(initialData.id_producto, newProduct);
        productoId = initialData.id_producto;
      } else {
        const addResult = await addProducto(newProduct);
        if (addResult && addResult.success) {
          result = true;
          productoId = addResult.id_producto;
        }
      }

      if (result && productoId) {
        // 2. Registrar Variantes (Dynamic)
        const attributesPayload = [];

        // Iterate over categoryAttrs to see what was selected
        categoryAttrs.forEach(attr => {
          const selectedIds = selectedAttrs[attr.id_atributo];
          if (selectedIds && selectedIds.length > 0) {
            // Find label/object for the IDs
            const selectedValues = selectedIds.map(valId => {
              const valObj = attr.values.find(v => String(v.id_valor) === String(valId));
              return { id: valId, label: valObj ? valObj.valor : '?' };
            });

            attributesPayload.push({
              id_atributo: attr.id_atributo,
              values: selectedValues
            });
          }
        });

        if (attributesPayload.length > 0) {
          await generateSKUs(productoId, attributesPayload);
        }

        // 3. Finalizar
        const marca = marcas.find(m => m.id_marca === parseInt(id_marca));
        const subcat = subcategorias.find(s => s.id_subcategoria === parseInt(id_subcategoria));
        const categoria = categorias.find(c => c.id_categoria === (subcat ? subcat.id_categoria : null));

        const productoResult = {
          ...newProduct,
          id_producto: productoId,
          nom_marca: marca ? marca.nom_marca : '',
          nom_subcat: subcat ? subcat.nom_subcat : '',
          id_categoria: categoria ? categoria.id_categoria : '',
          estado_producto: estado_producto === "1" ? "Activo" : "Inactivo"
        };

        toast.success(initialData ? "Producto actualizado correctamente" : "Producto creado correctamente");
        if (onSuccess) onSuccess(productoResult);
        handleCloseModal();
      } else {
        toast.error("Error al guardar el producto");
      }
    } catch (error) {
      toast.error("Error al realizar la gestión del producto");
      console.error(error);
    }
  };

  // Handlers para modals
  const handleModalMarca = () => setIsModalOpenMarca(!isModalOpenMarca);
  const handleModalCategoria = () => setIsModalOpenCategoria(!isModalOpenCategoria);
  const handleModalSubCategoria = () => setIsModalOpenSubCategorias(!isModalOpenSubCategoria);

  const handlePrice = (e) => {
    let newPrice = e.target.value;
    if (newPrice === '' || /^[0-9]*\.?[0-9]*$/.test(newPrice)) {
      setValue('precio', newPrice);
    }
  }

  const changePrice = () => {
    const price = parseFloat(getValues('precio'));
    if (!isNaN(price)) setValue('precio', price.toFixed(2));
  }

  const handleCloseModal = () => {
    setIsOpen(false);
    setTimeout(() => onClose(), 300);
  };

  // --- Dynamic Attribute Handlers ---
  const toggleAttributeValue = (idAttr, idVal) => {
    setSelectedAttrs(prev => {
      const current = prev[idAttr] || [];
      const exists = current.includes(String(idVal));
      let updated;
      if (exists) updated = current.filter(x => x !== String(idVal));
      else updated = [...current, String(idVal)];
      return { ...prev, [idAttr]: updated };
    });
  };

  return (
    <div>
      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        size="4xl"
        scrollBehavior="inside"
        backdrop="blur"
        isDismissable={false}
        classNames={{
          backdrop: "bg-slate-900/40 backdrop-blur-md z-[10005]",
          wrapper: "z-[10006] overflow-hidden",
          base: "z-[10007] max-h-[90vh] rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl my-4 overflow-hidden",
          header: "border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-4 px-6",
          body: "py-6 px-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent",
          footer: "border-t border-slate-100 dark:border-zinc-800 py-4 px-6 bg-slate-50/50 dark:bg-zinc-900/50 backdrop-blur-sm"
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader>
                <span className="text-xl font-bold text-slate-800 dark:text-white">{modalTitle}</span>
              </ModalHeader>
              <ModalBody>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                  {/* SECCIÓN 1: DATOS BÁSICOS */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Información Básica</h3>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-7 space-y-4">
                        <Controller
                          name="descripcion"
                          control={control}
                          rules={{ required: "La descripción es requerida" }}
                          render={({ field }) => (
                            <Textarea
                              {...field}
                              label="Descripción del Producto"
                              placeholder="Ej: Polo Algodón Pima Cuello Redondo - Verano 2025"
                              variant="faded"
                              labelPlacement="outside"
                              minRows={3}
                              isRequired
                              errorMessage={errors.descripcion?.message}
                            />
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <Controller
                            name="precio"
                            control={control}
                            rules={{ required: "Requerido" }}
                            render={({ field }) => (
                              <Input
                                {...field}
                                label="Precio Venta"
                                placeholder="0.00"
                                variant="faded"
                                labelPlacement="outside"
                                type="number"
                                startContent={<span className="text-slate-400">S/.</span>}
                                onChange={(e) => { handlePrice(e); field.onChange(e.target.value); }}
                                onBlur={changePrice}
                                isRequired
                              />
                            )}
                          />
                          <Controller
                            name="undm"
                            control={control}
                            render={({ field }) => (
                              <Select
                                {...field}
                                label="Unidad"
                                placeholder="Seleccione"
                                variant="faded"
                                labelPlacement="outside"
                                selectedKeys={field.value ? [field.value.toString()] : []}
                              >
                                {unidadesList.map((u) => (
                                  <SelectItem key={u.codigo_sunat} value={u.codigo_sunat}>
                                    {u.descripcion}
                                  </SelectItem>
                                ))}
                              </Select>
                            )}
                          />
                        </div>
                      </div>

                      <div className="md:col-span-5 space-y-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 shadow-sm">
                        <div className="flex gap-2 items-end">
                          <Controller
                            name="id_categoria"
                            control={control}
                            rules={{ required: "Requerido" }}
                            render={({ field }) => (
                              <Select
                                {...field}
                                label="Categoría"
                                placeholder="Seleccione"
                                variant="faded"
                                labelPlacement="outside"
                                className="flex-1"
                                selectedKeys={field.value ? [field.value] : []}
                                onChange={(e) => field.onChange(e.target.value)}
                              >
                                {categorias.map((c) => (
                                  <SelectItem key={c.id_categoria.toString()} value={c.id_categoria.toString()}>{c.nom_categoria}</SelectItem>
                                ))}
                              </Select>
                            )}
                          />
                          <Button isIconOnly size="sm" variant="light" onPress={handleModalCategoria} className="mb-2"><FaPlus /></Button>
                        </div>

                        <div className="flex gap-2 items-end">
                          <Controller
                            name="id_subcategoria"
                            control={control}
                            rules={{ required: "Requerido" }}
                            render={({ field }) => (
                              <Select
                                {...field}
                                label="Subcategoría"
                                placeholder="Seleccione"
                                variant="faded"
                                labelPlacement="outside"
                                className="flex-1"
                                isDisabled={!idCategoria}
                                selectedKeys={field.value ? [field.value.toString()] : []}
                              >
                                {filteredSubcategorias.map((s) => (
                                  <SelectItem key={s.id_subcategoria.toString()} value={s.id_subcategoria.toString()}>{s.nom_subcat}</SelectItem>
                                ))}
                              </Select>
                            )}
                          />
                          <Button isIconOnly size="sm" variant="light" onPress={handleModalSubCategoria} className="mb-2"><FaPlus /></Button>
                        </div>

                        <div className="flex gap-2 items-end">
                          <Controller
                            name="id_marca"
                            control={control}
                            rules={{ required: "Requerido" }}
                            render={({ field }) => (
                              <Select
                                {...field}
                                label="Marca"
                                placeholder="Seleccione"
                                variant="faded"
                                labelPlacement="outside"
                                className="flex-1"
                                selectedKeys={field.value ? [field.value.toString()] : []}
                              >
                                {marcas.map((m) => (
                                  <SelectItem key={m.id_marca.toString()} value={m.id_marca.toString()}>{m.nom_marca}</SelectItem>
                                ))}
                              </Select>
                            )}
                          />
                          <Button isIconOnly size="sm" variant="light" onPress={handleModalMarca} className="mb-2"><FaPlus /></Button>
                        </div>

                        <Controller
                          name="estado_producto"
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              label="Estado"
                              variant="faded"
                              labelPlacement="outside"
                              selectedKeys={field.value ? [field.value.toString()] : []}
                            >
                              <SelectItem key="1" value="1">Activo</SelectItem>
                              <SelectItem key="0" value="0">Inactivo</SelectItem>
                            </Select>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <Divider />

                  {/* SECCIÓN 2: VARIANTES (DINAMICO) */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Variantes del Producto</h3>
                      <Chip size="sm" variant="flat" color="warning">Configuración de Atributos</Chip>
                    </div>

                    {loadingAttrs ? (
                      <div className="text-center p-4">Cargando atributos...</div>
                    ) : categoryAttrs.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categoryAttrs.map(attr => (
                          <div key={attr.id_atributo} className="bg-slate-50 dark:bg-zinc-900/30 p-4 rounded-xl border border-slate-200 dark:border-zinc-800">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-semibold text-sm">{attr.nombre}</h4>
                              <span className="text-[10px] text-slate-400 uppercase">{attr.tipo_input}</span>
                            </div>
                            <ScrollShadow className="h-40 w-full">
                              {attr.values.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No hay valores definidos</p>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  {attr.values.map(val => (
                                    <Checkbox
                                      key={val.id_valor}
                                      isSelected={selectedAttrs[attr.id_atributo]?.includes(String(val.id_valor)) || false}
                                      onValueChange={() => toggleAttributeValue(attr.id_atributo, val.id_valor)}
                                    >
                                      <span className="text-sm">{val.valor}</span>
                                    </Checkbox>
                                  ))}
                                </div>
                              )}
                            </ScrollShadow>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                        {idCategoria ? (
                          <div className="flex flex-col items-center gap-2">
                            <p className="text-slate-500 font-medium">Esta categoría no tiene atributos configurados</p>
                            <p className="text-xs text-slate-400 max-w-xs mx-auto">
                              Para ver opciones aquí, debe asignar atributos a la categoría <strong>{categorias.find(c => c.id_categoria.toString() === idCategoria)?.nom_categoria}</strong> en Configuración &gt; Atributos.
                            </p>
                          </div>
                        ) : (
                          <>
                            <p className="text-slate-500">Seleccione una categoría para ver los atributos disponibles.</p>
                            <p className="text-xs text-slate-400 mt-1">Si no ve opciones, configure los atributos en la sección de Configuración.</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <input type="text" name="cod_barras" hidden disabled />

                  <ModalFooter className="flex justify-end gap-3 px-0 pt-4">
                    <ButtonClose onPress={handleCloseModal} />
                    <ButtonSave type="submit" />
                  </ModalFooter>
                </form>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modales Auxiliares */}
      {isModalOpenMarca && <ModalMarca modalTitle={'Marca'} closeModel={handleModalMarca} />}
      {isModalOpenCategoria && <ModalCategoria modalTitle={'Categoría'} closeModel={handleModalCategoria} />}
      {isModalOpenSubCategoria && <ModalSubCategoria modalTitle={'Sub-Categoría'} closeModel={handleModalSubCategoria} />}

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