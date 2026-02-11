import { useEffect, useState } from "react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/services/express.services";
import { Button, Input as NextInput, NumberInput, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Chip, Spinner } from "@heroui/react";
import { Input } from "@/components/ui/Input";
import { FaPlus, FaTrash, FaSearch, FaEdit, FaBox } from "react-icons/fa";
import { toast } from "react-hot-toast";

function ExpressInventory() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    // Form State
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({ name: "", price: "", stock: "" });
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => { loadProducts(); }, []);

    const loadProducts = async () => {
        setLoadingData(true);
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (e) { console.error(e); }
        finally { setLoadingData(false); }
    };

    const handleOpenCreate = () => {
        setEditingProduct(null);
        setFormData({ name: "", price: "", stock: "" });
        onOpen();
    };

    const handleOpenEdit = (product) => {
        setEditingProduct(product);
        setFormData({ name: product.name, price: product.price, stock: product.stock });
        onOpen();
    };

    const handleSubmit = async (onClose) => {
        if (!formData.name || !formData.price) {
            toast.error("Nombre y precio requeridos");
            return;
        }
        setLoading(true);
        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, formData);
                toast.success("Producto actualizado");
            } else {
                await createProduct(formData);
                toast.success("Producto creado");
            }
            await loadProducts();
            onClose();
        } catch (e) {
            toast.error("Error al guardar");
            console.error(e);
        }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Estás seguro de eliminar este producto?")) return;
        try {
            await deleteProduct(id);
            toast.success("Producto eliminado");
            loadProducts();
        } catch (e) { toast.error("Error al eliminar"); console.error(e); }
    };

    const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="min-h-full bg-zinc-950 pb-24 px-4 pt-2">
            {/* Header / Search */}
            <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-xl py-4 z-20 flex gap-2">
                <NextInput
                    placeholder="Buscar en inventario..."
                    value={search}
                    startContent={<FaSearch className="text-zinc-500" />}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1"
                    classNames={{
                        inputWrapper: "bg-zinc-900 border border-white/10 h-12 rounded-2xl",
                        input: "text-base"
                    }}
                />
                <Button isIconOnly className="h-12 w-12 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20" onPress={handleOpenCreate}>
                    <FaPlus />
                </Button>
            </div>

            {/* Product List/Grid */}
            {loadingData ? (
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" color="success" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {filtered.length === 0 && (
                        <div className="col-span-full h-60 flex flex-col items-center justify-center text-zinc-600 gap-4">
                            <FaBox size={40} className="opacity-20" />
                            <p>No se encontraron productos.</p>
                        </div>
                    )}
                    {filtered.map(p => (
                        <div
                            key={p.id}
                            onClick={() => handleOpenEdit(p)}
                            className="bg-zinc-900/50 p-4 rounded-3xl border border-white/5 shadow-sm active:scale-[0.98] transition-all hover:bg-zinc-800/50 hover:border-white/10 group cursor-pointer relative"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-xs">
                                    {String(p.name || "").substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex gap-2">
                                    <Button isIconOnly size="sm" variant="light" color="danger" onPress={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <FaTrash size={12} />
                                    </Button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h3 className="font-bold text-white text-lg leading-tight line-clamp-1">{p.name}</h3>
                                <p className="text-zinc-500 text-xs">ID: {String(p.id).substring(0, 8)}...</p>
                            </div>

                            <div className="flex justify-between items-end border-t border-white/5 pt-3">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Precio</span>
                                    <span className="text-emerald-400 font-bold text-xl tracking-tight">S/. {Number(p.price).toFixed(2)}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Stock</span>
                                    <Chip size="sm" variant="flat" className={`${p.stock < 5 ? 'bg-red-500/20 text-red-500' : 'bg-zinc-800 text-zinc-300'}`}>
                                        {p.stock} un.
                                    </Chip>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                placement="bottom"
                classNames={{
                    base: "m-0 sm:m-4 rounded-t-[30px] sm:rounded-3xl bg-zinc-950 border border-white/10",
                    backdrop: "bg-black/80 backdrop-blur-sm"
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 border-b border-white/5 py-6 bg-zinc-950">
                                <h1 className="text-2xl font-bold text-white">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h1>
                                <p className="text-sm text-zinc-500 font-normal">Ingresa los detalles del inventario</p>
                            </ModalHeader>
                            <ModalBody className="py-6 space-y-5 bg-zinc-950">
                                <div className="space-y-3">
                                    <label className="text-sm text-zinc-400 font-medium ml-1">Nombre del Producto</label>
                                    <Input
                                        placeholder="Ej. Gaseosa 3L"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-zinc-900 border-zinc-800 text-white h-14 text-lg placeholder:text-zinc-600 focus-visible:ring-emerald-500 rounded-xl"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <label className="text-sm text-zinc-400 font-medium ml-1">Precio (S/.)</label>
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            placeholder="0.00"
                                            value={formData.price}
                                            onChange={e => {
                                                const value = e.target.value;
                                                // Allow empty, digits, and one decimal point
                                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                                    setFormData({ ...formData, price: value });
                                                }
                                            }}
                                            onBlur={e => {
                                                const val = parseFloat(e.target.value);
                                                if (isNaN(val) || val < 0) {
                                                    setFormData({ ...formData, price: '0' });
                                                }
                                            }}
                                            className="bg-zinc-900 border-zinc-800 text-white h-14 text-lg placeholder:text-zinc-600 focus-visible:ring-emerald-500 rounded-xl font-mono tracking-wider"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm text-zinc-400 font-medium ml-1">Stock Inicial</label>
                                        <Input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="0"
                                            value={formData.stock}
                                            onChange={e => {
                                                const value = e.target.value;
                                                // Allow empty or digits only (integers)
                                                if (value === '' || /^\d*$/.test(value)) {
                                                    setFormData({ ...formData, stock: value });
                                                }
                                            }}
                                            onBlur={e => {
                                                const val = parseInt(e.target.value);
                                                if (isNaN(val) || val < 0) {
                                                    setFormData({ ...formData, stock: '0' });
                                                }
                                            }}
                                            className="bg-zinc-900 border-zinc-800 text-white h-14 text-lg placeholder:text-zinc-600 focus-visible:ring-emerald-500 rounded-xl font-mono tracking-wider"
                                        />
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter className="border-t border-white/5 p-6 flex flex-col gap-3 bg-zinc-950">
                                <Button
                                    className="w-full bg-emerald-500 text-white font-bold h-14 text-lg shadow-lg shadow-emerald-500/20 rounded-xl"
                                    onPress={() => handleSubmit(onClose)}
                                    isLoading={loading}
                                >
                                    {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                                </Button>
                                <Button
                                    className="w-full h-14 bg-zinc-900 text-zinc-400 font-bold border border-white/5 rounded-xl hover:bg-zinc-800 hover:text-white"
                                    onPress={onClose}
                                >
                                    Cancelar
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
export default ExpressInventory;
