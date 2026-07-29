import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type {
  Product, Brand, Category, Subcategory, UnitOfMeasure, ProductAttribute
} from "../types";
import {
  createProduct, updateProduct, getProduct, getBrands, getCategories, getSubcategories,
  getUnits, getLastIdProducto, getCategoryAttributes, getAttributeValues, generateSKUs,
  getProductAttributes
} from "../api/products";
import { useUserStore } from "@/store/useUserStore";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Zod Validation Schema
const productSchema = z.object({
  descripcion: z.string().min(3, "La descripción debe tener al menos 3 caracteres"),
  precio: z.string().min(1, "El precio es obligatorio").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0, 
    "El precio debe ser un número positivo"
  ),
  cod_barras: z.string().optional().or(z.literal("")),
  undm: z.string().min(1, "Debe seleccionar una unidad de medida"),
  id_marca: z.string().min(1, "Debe seleccionar una marca"),
  id_categoria: z.string().min(1, "Debe seleccionar una categoría"),
  id_subcategoria: z.string().min(1, "Debe seleccionar una subcategoría"),
  estado_producto: z.string(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: Product | null;
}

export default function ProductForm({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: ProductFormProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  // Atributos dinámicos (talla, color…) según la categoría elegida
  const [categoryAttrs, setCategoryAttrs] = useState<ProductAttribute[]>([]);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<number, string[]>>({});
  const [loadingAttrs, setLoadingAttrs] = useState(false);

  const tenantId = useUserStore((state) => state.user?.id_tenant);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      descripcion: "",
      precio: "",
      cod_barras: "",
      undm: "",
      id_marca: "",
      id_categoria: "",
      id_subcategoria: "",
      estado_producto: "1",
    },
  });

  const watchIdCategoria = watch("id_categoria");

  // Load select lists (Brands, Categories, Subcategories, Units)
  useEffect(() => {
    const loadMetadata = async () => {
      setLoadingMetadata(true);
      try {
        const [brandsList, categoriesList, subsList, unitsList] = await Promise.all([
          getBrands(),
          getCategories(),
          getSubcategories(),
          getUnits(),
        ]);
        setBrands(brandsList);
        setCategories(categoriesList);
        setSubcategories(subsList);
        setUnits(unitsList);
      } catch (err) {
        console.error("Error loading form metadata:", err);
      } finally {
        setLoadingMetadata(false);
      }
    };

    if (isOpen) {
      loadMetadata();
    }
  }, [isOpen]);

  // Cargar atributos de la categoría elegida (con sus valores) para el
  // bloque de variantes más abajo.
  useEffect(() => {
    const loadAttributes = async () => {
      if (!watchIdCategoria) {
        setCategoryAttrs([]);
        return;
      }

      setLoadingAttrs(true);
      try {
        const catId = Number(watchIdCategoria);
        const attrs = await getCategoryAttributes(catId);

        const attrsWithValues = await Promise.all(
          attrs.map(async (attr) => {
            const valuesList = await getAttributeValues(attr.id_atributo);
            return { ...attr, values: valuesList };
          })
        );

        setCategoryAttrs(attrsWithValues);
      } catch (err) {
        console.error("Error loading category attributes:", err);
      } finally {
        setLoadingAttrs(false);
      }
    };

    loadAttributes();
  }, [watchIdCategoria]);

  // Set default form values in Edit mode
  useEffect(() => {
    if (!isOpen || loadingMetadata) return;

    if (initialData) {
      const loadProductDetails = async () => {
        let prod = initialData;
        try {
          const fetched = await getProduct(initialData.id_producto);
          if (fetched && fetched.id_producto) {
            prod = fetched;
          }
        } catch (err) {
          console.error("Error fetching product detail:", err);
        }

        const idCat = prod.id_categoria
          ?? subcategories.find((s) => Number(s.id_subcategoria) === Number(prod.id_subcategoria))?.id_categoria
          ?? "";

        reset({
          descripcion: prod.descripcion || "",
          precio: String(prod.precio ?? ""),
          cod_barras: prod.cod_barras || "",
          undm: prod.undm || "",
          id_marca: String(prod.id_marca ?? ""),
          id_categoria: String(idCat ?? ""),
          id_subcategoria: String(prod.id_subcategoria ?? ""),
          estado_producto: String(prod.estado_producto ?? prod.estado ?? "1"),
        });

        // Cargar los valores de atributo ya seleccionados en modo edición
        try {
          const response = await getProductAttributes(prod.id_producto);
          const attrsList = response?.attributes || (response as any)?.data?.attributes || [];
          if (attrsList && attrsList.length > 0) {
            const preSelected: Record<number, string[]> = {};
            attrsList.forEach((attr: any) => {
              if (attr.values && attr.values.length > 0) {
                preSelected[attr.id_atributo] = attr.values.map((v: any) => String(v.id ?? v.id_valor));
              }
            });
            setSelectedAttrs(preSelected);
          } else {
            setSelectedAttrs({});
          }
        } catch (err) {
          console.error("Error loading product attributes:", err);
        }
      };

      loadProductDetails();
    } else {
      // Create mode: clear form and generate unique barcode prefix
      reset({
        descripcion: "",
        precio: "",
        cod_barras: "",
        undm: "",
        id_marca: "",
        id_categoria: "",
        id_subcategoria: "",
        estado_producto: "1",
      });
      setSelectedAttrs({});

      const generateBarcode = async () => {
        try {
          const lastId = await getLastIdProducto();
          const tenantPrefix = tenantId ? `T${tenantId}-` : "";
          const newBarcode = `${tenantPrefix}P${String(lastId ? lastId + 1 : 1).padStart(8, "0")}`;
          setValue("cod_barras", newBarcode);
        } catch (err) {
          console.error("Error auto-generating barcode:", err);
        }
      };

      generateBarcode();
    }
  }, [initialData, reset, loadingMetadata, isOpen, tenantId, setValue, subcategories]);

  // Filter subcategories based on active Category
  const filteredSubcategories = useMemo(() => {
    if (!watchIdCategoria) return [];
    return subcategories.filter(
      (sub) => Number(sub.id_categoria) === Number(watchIdCategoria)
    );
  }, [watchIdCategoria, subcategories]);

  const handleAttributeCheckboxChange = (attrId: number, valueId: string, checked: boolean) => {
    setSelectedAttrs((prev) => {
      const current = prev[attrId] || [];
      if (checked) {
        return { ...prev, [attrId]: [...current, valueId] };
      } else {
        return { ...prev, [attrId]: current.filter((id) => id !== valueId) };
      }
    });
  };

  const onSubmit = async (values: ProductFormValues) => {
    setLoading(true);
    try {
      const payload = {
        descripcion: values.descripcion,
        id_marca: Number(values.id_marca),
        id_subcategoria: Number(values.id_subcategoria),
        precio: Number(values.precio).toFixed(2),
        cod_barras: values.cod_barras || "",
        undm: values.undm,
        estado_producto: Number(values.estado_producto),
      };

      let isSuccess = false;
      let productId = initialData?.id_producto || null;

      if (initialData) {
        // Edit mode
        isSuccess = await updateProduct(initialData.id_producto, payload);
      } else {
        // Create mode
        const res = await createProduct(payload);
        isSuccess = res.success;
        productId = res.id_producto;
      }

      if (isSuccess && productId) {
        // Guardar variantes/atributos seleccionados dinámicamente
        const attributesPayload: { id_atributo: number; values: { id: string; label: string }[] }[] = [];

        categoryAttrs.forEach((attr) => {
          const selectedValIds = selectedAttrs[attr.id_atributo];
          if (selectedValIds && selectedValIds.length > 0) {
            const selectedValues = selectedValIds.map((valId) => {
              const valObj = attr.values?.find((v) => String(v.id_valor) === String(valId));
              return { id: valId, label: valObj ? valObj.valor : "?" };
            });

            attributesPayload.push({
              id_atributo: attr.id_atributo,
              values: selectedValues,
            });
          }
        });

        if (attributesPayload.length > 0) {
          await generateSKUs(productId, attributesPayload);
        }

        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Error submitting product form:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-slate-200/50 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {initialData ? "Editar Producto" : "Registrar Nuevo Producto"}
          </DialogTitle>
        </DialogHeader>

        {loadingMetadata ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Description */}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="descripcion">Descripción / Nombre del Producto</Label>
                <Controller
                  name="descripcion"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="descripcion"
                      placeholder="Ej: Camiseta Algodón Premium"
                      className=""
                    />
                  )}
                />
                {errors.descripcion && (
                  <p className="text-xs text-destructive">{errors.descripcion.message}</p>
                )}
              </div>

              {/* Brand */}
              <div className="space-y-2">
                <Label htmlFor="id_marca">Marca</Label>
                <Controller
                  name="id_marca"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="id_marca" className="w-full">
                        <SelectValue placeholder="Selecciona una marca" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {brands.map((b) => (
                          <SelectItem key={b.id_marca} value={String(b.id_marca)}>
                            {b.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.id_marca && (
                  <p className="text-xs text-destructive">{errors.id_marca.message}</p>
                )}
              </div>

              {/* Unit of Measure */}
              <div className="space-y-2">
                <Label htmlFor="undm">Unidad de Medida</Label>
                <Controller
                  name="undm"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="undm" className="w-full">
                        <SelectValue placeholder="Selecciona Unidad" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {units.map((u) => (
                          <SelectItem key={u.id_unidad} value={u.simbolo}>
                            {u.nombre} ({u.simbolo})
                          </SelectItem>
                        ))}
                        <SelectItem value="NIU">Unidad (NIU)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.undm && (
                  <p className="text-xs text-destructive">{errors.undm.message}</p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="id_categoria">Categoría</Label>
                <Controller
                  name="id_categoria"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="id_categoria" className="w-full">
                        <SelectValue placeholder="Selecciona Categoría" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {categories.map((c) => (
                          <SelectItem key={c.id_categoria} value={String(c.id_categoria)}>
                            {c.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.id_categoria && (
                  <p className="text-xs text-destructive">{errors.id_categoria.message}</p>
                )}
              </div>

              {/* Subcategory */}
              <div className="space-y-2">
                <Label htmlFor="id_subcategoria">Subcategoría</Label>
                <Controller
                  name="id_subcategoria"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!watchIdCategoria}
                    >
                      <SelectTrigger id="id_subcategoria" className="w-full">
                        <SelectValue placeholder="Selecciona Subcategoría" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {filteredSubcategories.map((s) => (
                          <SelectItem key={s.id_subcategoria} value={String(s.id_subcategoria)}>
                            {s.nombre_sub}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.id_subcategoria && (
                  <p className="text-xs text-destructive">{errors.id_subcategoria.message}</p>
                )}
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="precio">Precio (S/.)</Label>
                <Controller
                  name="precio"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="precio"
                      type="text"
                      placeholder="0.00"
                      className=""
                    />
                  )}
                />
                {errors.precio && (
                  <p className="text-xs text-destructive">{errors.precio.message}</p>
                )}
              </div>

              {/* Barcode */}
              <div className="space-y-2">
                <Label htmlFor="cod_barras">Código de Barras</Label>
                <Controller
                  name="cod_barras"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="cod_barras"
                      placeholder="Generado automáticamente"
                      className=""
                    />
                  )}
                />
              </div>

              {/* Product State */}
              <div className="space-y-2">
                <Label htmlFor="estado_producto">Estado</Label>
                <Controller
                  name="estado_producto"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="estado_producto" className="w-full">
                        <SelectValue placeholder="Activo" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value="1">Activo</SelectItem>
                        <SelectItem value="0">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Atributos y variantes dinámicas */}
            {watchIdCategoria && (
              <div className="border-t border-slate-100 dark:border-zinc-900 pt-4">
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-brand" />
                  Atributos y Variantes del Producto
                </h4>

                {loadingAttrs ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-brand" />
                    Cargando atributos del producto...
                  </div>
                ) : categoryAttrs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">
                    Esta categoría no tiene atributos adicionales configurados para variantes.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {categoryAttrs.map((attr) => (
                      <div key={attr.id_atributo} className="bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-slate-100/50 dark:border-zinc-800/30">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                          {attr.nombre}
                        </Label>
                        <div className="flex flex-wrap gap-4 mt-2">
                          {attr.values?.map((val) => {
                            const isChecked = (selectedAttrs[attr.id_atributo] || []).includes(String(val.id_valor));
                            return (
                              <label key={val.id_valor} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) =>
                                    handleAttributeCheckboxChange(attr.id_atributo, String(val.id_valor), !!checked)
                                  }
                                />
                                <span className="text-slate-700 dark:text-slate-300 font-medium">
                                  {val.valor}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="border-t border-slate-100 dark:border-zinc-900 pt-4 flex gap-2 justify-end">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="rounded-xl">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Actualizar Producto" : "Guardar Producto"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
