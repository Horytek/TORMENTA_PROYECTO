import React, { useState, useEffect } from "react";
import { Button, Input, Textarea, Select, SelectItem, Card, CardBody, Autocomplete, AutocompleteItem, Chip } from "@heroui/react";
import axios from "@/api/axios";
import { toast } from "react-hot-toast";
import { Plus, X, Box, Save } from "lucide-react";
import { useAuth } from "@/context/Auth/AuthProvider";
import { getProductVariants } from "@/services/productos.services";

export default function SolicitudInventario() {
    const { user } = useAuth();
    const [productos, setProductos] = useState([]);

    // Formulario Cabecera
    const [descripcion, setDescripcion] = useState("");

    // Lista de items del lote
    const [items, setItems] = useState([]);

    // Item temporal siendo agregado
    const [tempItem, setTempItem] = useState({
        id_producto: "",
        id_sku: "",
        cantidad: 1
    });

    const [variants, setVariants] = useState([]); // SKUs for selected product

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const pRes = await axios.get("/productos");
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
                const skus = await getProductVariants(tempItem.id_producto, true); // true = include zero stock (irrelevant here but consistent)
                setVariants(skus || []);
                setTempItem(prev => ({ ...prev, id_sku: "" }));
            } catch (error) {
                console.error("Error fetching variants", error);
            }
        };
        fetchVariants();
    }, [tempItem.id_producto]);

    const addItem = () => {
        if (!tempItem.id_producto || !tempItem.cantidad) {
            toast.error("Seleccione producto y cantidad");
            return;
        }

        // If product has variants, SKU is required
        if (variants.length > 0 && !tempItem.id_sku) {
            toast.error("Seleccione una variante");
            return;
        }

        const prod = productos.find(p => p.id_producto === parseInt(tempItem.id_producto));
        let skuName = "Standard";

        if (tempItem.id_sku) {
            const v = variants.find(v => String(v.id_sku) === String(tempItem.id_sku));
            skuName = v ? (v.nombre_sku || v.sku) : "Desconocido"; // backend returns 'nombre_sku' or 'sku'
        } else if (variants.length > 0) {
            // Should be caught above, but safety check
            skuName = "Variante no seleccionada";
        }

        const newItem = {
            id: Date.now(),
            id_producto: tempItem.id_producto,
            id_sku: tempItem.id_sku || null,
            cantidad: tempItem.cantidad,
            productoName: prod?.descripcion || "Desconocido",
            skuName: skuName
        };

        setItems([...items, newItem]);
        setTempItem({ ...tempItem, id_sku: "", cantidad: 1 });
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
                productos: items // Contains id_sku
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
                                        onSelectionChange={(key) => setTempItem({ ...tempItem, id_producto: key })}
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
                                        <Select
                                            label="Variante (SKU)"
                                            labelPlacement="outside"
                                            placeholder="Seleccione variante"
                                            selectedKeys={tempItem.id_sku ? [String(tempItem.id_sku)] : []}
                                            onChange={(e) => setTempItem({ ...tempItem, id_sku: e.target.value })}
                                            variant="bordered"
                                            classNames={{ trigger: "bg-slate-50 dark:bg-zinc-800/50 h-10" }}
                                        >
                                            {variants.map(v => (
                                                <SelectItem key={v.id_sku} value={v.id_sku} textValue={v.nombre_sku || v.sku}>
                                                    <div className="flex flex-col">
                                                        <span>{v.nombre_sku || v.sku}</span>
                                                        <span className="text-[10px] text-slate-400">{v.cod_barras || 'Sin código'}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </Select>
                                    ) : tempItem.id_producto ? (
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-xs text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/20">
                                            Producto simple (sin variantes)
                                        </div>
                                    ) : null}

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
                                        <Button isIconOnly color="primary" className="h-10 w-12" onPress={addItem}>
                                            <Plus size={20} />
                                        </Button>
                                    </div>
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
                                                <th className="p-4 text-right">Cant.</th>
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
                                                        {item.skuName !== "Standard" ? (
                                                            <Chip size="sm" variant="flat" color="secondary">{item.skuName}</Chip>
                                                        ) : (
                                                            <span className="text-slate-400">Standard</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <input
                                                            type="number"
                                                            value={item.cantidad}
                                                            onChange={(e) => updateItem(item.id, 'cantidad', e.target.value)}
                                                            className="w-16 p-1 text-right border rounded text-slate-700 bg-transparent"
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
        </div>
    );
}
