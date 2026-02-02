import React, { useState, useEffect, useMemo } from "react";
import { Button, Input, Textarea, Select, SelectItem, Card, CardBody, Autocomplete, AutocompleteItem, Chip } from "@heroui/react";
import axios from "@/api/axios";
import { toast } from "react-hot-toast";
import { Plus, X, Box, Save, Layers } from "lucide-react";
import { useAuth } from "@/context/Auth/AuthProvider";
import { getProductVariants } from "@/services/productos.services";
import VariantSelectionModal from "@/components/Modals/VariantSelectionModal";

export default function SolicitudInventario() {
    const { user } = useAuth();
    const [productos, setProductos] = useState([]);

    // Formulario Cabecera
    const [descripcion, setDescripcion] = useState("");

    // Lista de items del lote
    const [items, setItems] = useState([]);

    // Item temporal siendo agregado (Solo para productos simples o selección inicial)
    const [tempItem, setTempItem] = useState({
        id_producto: "",
        id_sku: "",
        cantidad: 1
    });

    const [variants, setVariants] = useState([]); // SKUs for selected product
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const pRes = await axios.get("/productos?limit=1000"); // Ensure we get enough products
            setProductos(pRes.data.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando productos");
        }
    };

    // Effect to fetch variants when product changes
    useEffect(() => {
        const fetchVariants = async () => {
            if (!tempItem.id_producto) {
                setVariants([]);
                return;
            }

            try {
                // Fetch SKUs
                const skus = await getProductVariants(tempItem.id_producto, true); // true = include zero stock
                setVariants(skus || []);
                setTempItem(prev => ({ ...prev, id_sku: "" }));
            } catch (error) {
                console.error("Error fetching variants", error);
            }
        };
        fetchVariants();
    }, [tempItem.id_producto]);

    // Add Simple Product (No variants)
    const addSimpleItem = () => {
        if (!tempItem.id_producto || !tempItem.cantidad) {
            toast.error("Seleccione producto y cantidad");
            return;
        }

        const prod = productos.find(p => p.id_producto === parseInt(tempItem.id_producto));

        // Safety check if it unexpectedly has variants
        if (variants.length > 0) {
            setIsVariantModalOpen(true);
            return;
        }

        const newItem = {
            id: Date.now(),
            id_producto: tempItem.id_producto,
            id_sku: null, // Simple product usually has null id_sku or default? Assuming null for now based on logic
            cantidad: parseInt(tempItem.cantidad),
            productoName: prod?.descripcion || "Desconocido",
            skuName: "Standard",
            attributes: []
        };

        setItems(prev => [...prev, newItem]);
        setTempItem({ ...tempItem, cantidad: 1 });
        toast.success("Producto agregado");
    };

    // Callback from Variant Modal
    const handleVariantConfirm = (selectedVariants) => {
        if (!selectedVariants || selectedVariants.length === 0) return;

        const prod = productos.find(p => p.id_producto === parseInt(tempItem.id_producto));
        const newItems = selectedVariants.map((v, index) => ({
            id: Date.now() + index,
            id_producto: tempItem.id_producto,
            id_sku: v.id_sku,
            cantidad: v.quantity,
            productoName: prod?.descripcion || "Desconocido",
            skuName: v.nombre_sku || v.sku || "Variante",
            attributes: v.resolvedAttributes // [{ label, value, hex }]
        }));

        setItems(prev => [...prev, ...newItems]);
        // Reset temp item slightly but keep product selected if user wants to add more? 
        // Better UX to keep product selected but maybe close modal.
        // setTempItem({ ...tempItem, id_producto: "" }); // Optional: Reset product
    };

    const removeItem = (id) => {
        setItems(items.filter(i => i.id !== id));
    };

    const updateItem = (id, field, value) => {
        setItems(items.map(i => {
            if (i.id !== id) return i;
            return { ...i, [field]: value };
        }));
    };

    const handleSubmit = async () => {
        if (items.length === 0) {
            toast.error("Agregue al menos un producto");
            return;
        }
        if (!descripcion.trim()) {
            toast.error("Ingrese una descripción");
            return;
        }

        try {
            const payload = {
                descripcion,
                id_usuario: user.id || user.id_usuario,
                productos: items
            };
            const res = await axios.post("/lote/create", payload);

            if (res.data.code === 1) {
                toast.success("Solicitud creada correctamente");
                setItems([]);
                setDescripcion("");
                setTempItem({
                    id_producto: "",
                    id_sku: "",
                    cantidad: 1
                });
                setVariants([]);
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al crear solicitud");
        }
    };

    // Get selected product object for Modal
    const selectedProductObj = useMemo(() => {
        if (!tempItem.id_producto) return null;
        const p = productos.find(x => String(x.id_producto) === String(tempItem.id_producto));
        // Construct object expected by VariantSelectionModal
        // It expects { codigo: id_producto, nombre: descripcion ... } based on usage in other files
        // service uses `product.codigo` for getProductVariants(id).
        return p ? { ...p, codigo: p.id_producto, nombre: p.descripcion } : null;
    }, [tempItem.id_producto, productos]);

    return (
        <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#09090b] p-4 md:p-6 space-y-6 transition-colors duration-200">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Solicitud de Entrada de Inventario
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Configure el nuevo lote de ingreso mediante selección de SKUs.
                    </p>
                </div>
                <Button
                    className="bg-blue-600 text-white font-bold shadow-blue-500/30"
                    onPress={handleSubmit}
                    startContent={<Save size={20} />}
                >
                    Guardar Solicitud
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* COLUMNA IZQUIERDA: FORMULARIO */}
                <div className="lg:col-span-4 space-y-4">
                    <Card className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl">
                        <CardBody className="p-5 space-y-6">
                            <div>
                                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
                                    Detalles del Lote
                                </h2>
                                <Textarea
                                    label="Descripción / Referencia"
                                    labelPlacement="outside"
                                    placeholder="Ej: Lote llegada Viernes 13..."
                                    value={descripcion}
                                    onValueChange={setDescripcion}
                                    variant="bordered"
                                    minRows={2}
                                />
                            </div>

                            <div className="border-t border-slate-100 dark:border-zinc-800"></div>

                            <div>
                                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span>
                                    Agregar Producto
                                </h2>

                                <div className="space-y-4">
                                    <Autocomplete
                                        label="Producto"
                                        labelPlacement="outside"
                                        placeholder="Buscar por nombre o código..."
                                        defaultItems={productos}
                                        selectedKey={tempItem.id_producto ? String(tempItem.id_producto) : null}
                                        onSelectionChange={(key) => setTempItem({ ...tempItem, id_producto: key, id_sku: "" })}
                                        variant="bordered"
                                        inputProps={{
                                            classNames: { inputWrapper: "bg-slate-50 dark:bg-zinc-800/50 h-10" }
                                        }}
                                    >
                                        {(item) => (
                                            <AutocompleteItem key={String(item.id_producto)} textValue={item.descripcion}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{item.descripcion}</span>
                                                    <span className="text-xs text-slate-400">Marca: {item.nom_marca || item.marca || 'N/A'}</span>
                                                </div>
                                            </AutocompleteItem>
                                        )}
                                    </Autocomplete>

                                    {variants.length > 0 ? (
                                        <div className="p-4 bg-slate-50 dark:bg-zinc-800/30 rounded-lg border border-slate-100 dark:border-zinc-800 flex flex-col gap-3">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <Layers size={16} />
                                                <span>Este producto tiene variantes</span>
                                            </div>
                                            <Button
                                                color="primary"
                                                variant="flat"
                                                className="w-full font-semibold"
                                                onPress={() => setIsVariantModalOpen(true)}
                                            >
                                                Seleccionar Variantes
                                            </Button>
                                        </div>
                                    ) : tempItem.id_producto ? (
                                        <div className="flex gap-3 items-end">
                                            <div className="flex-1">
                                                <Input
                                                    type="number"
                                                    label="Cantidad"
                                                    labelPlacement="outside"
                                                    placeholder="0"
                                                    value={tempItem.cantidad}
                                                    onValueChange={(v) => setTempItem({ ...tempItem, cantidad: v })}
                                                    min={1}
                                                    variant="bordered"
                                                />
                                            </div>
                                            <Button isIconOnly color="primary" className="h-10 w-12" onPress={addSimpleItem}>
                                                <Plus size={20} />
                                            </Button>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* COLUMNA DERECHA: TABLA */}
                <div className="lg:col-span-8">
                    <Card className="h-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl">
                        <CardBody className="p-0">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-10 text-slate-400">
                                    <Box size={48} className="mb-2 opacity-50" />
                                    <p>No hay productos agregados al lote</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 dark:bg-zinc-900/50 text-slate-500 dark:text-slate-400 font-semibold uppercase text-xs">
                                            <tr>
                                                <th className="p-4">Producto</th>
                                                <th className="p-4">Variante</th>
                                                <th className="p-4 text-center">Cant.</th>
                                                <th className="p-4 text-center">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                            {items.map(item => (
                                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                    <td className="p-4 font-medium text-slate-700 dark:text-slate-200">
                                                        {item.productoName}
                                                    </td>
                                                    <td className="p-4">
                                                        {item.attributes && item.attributes.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {item.attributes.map((attr, idx) => (
                                                                    <Chip
                                                                        key={idx}
                                                                        size="sm"
                                                                        variant="flat"
                                                                        className="text-xs h-6"
                                                                        startContent={
                                                                            attr.hex ? (
                                                                                <span
                                                                                    className="w-2 h-2 rounded-full ml-1"
                                                                                    style={{ backgroundColor: attr.hex }}
                                                                                />
                                                                            ) : null
                                                                        }
                                                                    >
                                                                        {attr.label}: {attr.value}
                                                                    </Chip>
                                                                ))}
                                                            </div>
                                                        ) : item.skuName !== "Standard" ? (
                                                            <Chip size="sm" variant="flat" color="secondary">{item.skuName}</Chip>
                                                        ) : (
                                                            <span className="text-slate-400">Standard</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <Input
                                                            type="number"
                                                            size="sm"
                                                            value={item.cantidad}
                                                            onValueChange={(val) => updateItem(item.id, 'cantidad', val)}
                                                            className="w-24 mx-auto"
                                                            classNames={{
                                                                input: "text-center font-semibold",
                                                                inputWrapper: "h-8 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 hover:border-blue-400 focus-within:border-blue-500 shadow-sm"
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <button onClick={() => removeItem(item.id)} className="text-rose-500 hover:text-rose-700">
                                                            <X size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Modal de selección de variantes */}
            <VariantSelectionModal
                isOpen={isVariantModalOpen}
                onClose={() => setIsVariantModalOpen(false)}
                product={selectedProductObj}
                onConfirm={handleVariantConfirm}
                mode="ingreso" // Important: allows selecting any quantity (no stock limit)
            />
        </div>
    );
}
