import React, { useState, useEffect } from "react";
import { Button, Input, Textarea, Select, SelectItem, Card, CardBody, User, Autocomplete, AutocompleteItem } from "@heroui/react";
import axios from "@/api/axios";
import { toast } from "react-hot-toast";
import { Plus, X, Box, Save, Search } from "lucide-react";
import { useAuth } from "@/context/Auth/AuthProvider";

export default function SolicitudInventario() {
    const { user } = useAuth();
    const [productos, setProductos] = useState([]);
    const [tonalidades, setTonalidades] = useState([]);
    const [tallas, setTallas] = useState([]);

    // Formulario Cabecera
    const [descripcion, setDescripcion] = useState("");

    // Lista de items del lote
    const [items, setItems] = useState([]);

    // Item temporal siendo agregado
    const [tempItem, setTempItem] = useState({
        id_producto: "",
        id_tonalidad: "",
        id_talla: "",
        cantidad: 1
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [pRes, tonRes, talRes] = await Promise.all([
                axios.get("/productos"),
                axios.get("/tonalidad"),
                axios.get("/talla")
            ]);
            setProductos(pRes.data.data || []);
            setTonalidades(tonRes.data.data || []);
            setTallas(talRes.data.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Error cargando catálogos");
        }
    };

    const addItem = () => {
        if (!tempItem.id_producto || !tempItem.cantidad) {
            toast.error("Seleccione producto y cantidad");
            return;
        }

        const prod = productos.find(p => p.id_producto === parseInt(tempItem.id_producto));
        const ton = tonalidades.find(t => t.id_tonalidad === parseInt(tempItem.id_tonalidad));
        const tal = tallas.find(t => t.id_talla === parseInt(tempItem.id_talla));

        const newItem = {
            ...tempItem,
            id: Date.now(),
            productoName: prod?.descripcion || "Desconocido",
            tonalidadName: ton?.nombre || "N/A",
            tallaName: tal?.nombre || "N/A"
        };

        setItems([...items, newItem]);
        setTempItem({ ...tempItem, id_tonalidad: "", id_talla: "", cantidad: 1 });
    };

    const removeItem = (id) => {
        setItems(items.filter(i => i.id !== id));
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
                id_usuario: user.id_usuario,
                productos: items
            };
            const res = await axios.post("/lote/create", payload);
            if (res.data.code === 1) {
                toast.success("Solicitud creada correctamente");
                setItems([]);
                setDescripcion("");
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
                        Configure el nuevo lote de ingreso.
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
                                    classNames={{
                                        inputWrapper: "bg-slate-50 dark:bg-zinc-800/50 hover:bg-slate-100 transition-colors"
                                    }}
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
                                        className="max-w-full"
                                        inputProps={{
                                            classNames: {
                                                inputWrapper: "bg-slate-50 dark:bg-zinc-800/50 h-12"
                                            }
                                        }}
                                        listboxProps={{
                                            emptyContent: "No se encontraron productos",
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

                                    <div className="grid grid-cols-2 gap-3">
                                        <Select
                                            label="Tonalidad"
                                            labelPlacement="outside"
                                            placeholder="Seleccione"
                                            selectedKeys={tempItem.id_tonalidad ? [String(tempItem.id_tonalidad)] : []}
                                            onChange={(e) => setTempItem({ ...tempItem, id_tonalidad: e.target.value })}
                                            variant="bordered"
                                            classNames={{
                                                trigger: "bg-slate-50 dark:bg-zinc-800/50 h-12"
                                            }}
                                        >
                                            {tonalidades.map(t => <SelectItem key={t.id_tonalidad} value={t.id_tonalidad}>{t.nombre}</SelectItem>)}
                                        </Select>

                                        <Select
                                            label="Talla"
                                            labelPlacement="outside"
                                            placeholder="Seleccione"
                                            selectedKeys={tempItem.id_talla ? [String(tempItem.id_talla)] : []}
                                            onChange={(e) => setTempItem({ ...tempItem, id_talla: e.target.value })}
                                            variant="bordered"
                                            classNames={{
                                                trigger: "bg-slate-50 dark:bg-zinc-800/50 h-12"
                                            }}
                                        >
                                            {tallas.map(t => <SelectItem key={t.id_talla} value={t.id_talla}>{t.nombre}</SelectItem>)}
                                        </Select>
                                    </div>

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
                                                classNames={{
                                                    inputWrapper: "bg-slate-50 dark:bg-zinc-800/50 h-12"
                                                }}
                                            />
                                        </div>
                                        <Button isIconOnly color="primary" className="h-12 w-12 shadow-lg shadow-blue-500/20 mb-[1px]" onPress={addItem}>
                                            <Plus size={24} />
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
                                                <th className="p-4">Tonalidad</th>
                                                <th className="p-4">Talla</th>
                                                <th className="p-4 text-right">Cant.</th>
                                                <th className="p-4 text-center">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                            {items.map(item => (
                                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                    <td className="p-4 font-medium text-slate-700 dark:text-slate-200">{item.productoName}</td>
                                                    <td className="p-4 text-slate-500 dark:text-slate-400">{item.tonalidadName}</td>
                                                    <td className="p-4 text-slate-500 dark:text-slate-400">{item.tallaName}</td>
                                                    <td className="p-4 text-right font-bold text-slate-800 dark:text-slate-200">{item.cantidad}</td>
                                                    <td className="p-4 text-center">
                                                        <button onClick={() => removeItem(item.id)} className="text-rose-500 hover:text-rose-700 p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
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

