import { useEffect, useState } from "react";
import { getProducts, createProduct, deleteProduct } from "@/services/express.services";
import { Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { FaPlus, FaTrash, FaSearch } from "react-icons/fa";

function ExpressInventory() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    // New Product State
    const [newName, setNewName] = useState("");
    const [newPrice, setNewPrice] = useState("");
    const [newStock, setNewStock] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadProducts(); }, []);

    const loadProducts = async () => {
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (e) { console.error(e); }
    };

    const handleCreate = async (onClose) => {
        if (!newName || !newPrice) return;
        setLoading(true);
        try {
            await createProduct({ name: newName, price: newPrice, stock: newStock });
            await loadProducts();
            setNewName(""); setNewPrice(""); setNewStock("");
            onClose();
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Estás seguro de eliminar este producto?")) return;
        try {
            await deleteProduct(id);
            loadProducts();
        } catch (e) { console.error(e); }
    };

    const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-4 pb-20">
            <div className="sticky top-0 bg-zinc-950/80 backdrop-blur-md pt-2 pb-2 z-10">
                <div className="flex gap-2">
                    <Input
                        placeholder="Buscar producto..."
                        value={search}
                        startContent={<FaSearch className="text-zinc-500" />}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1"
                        classNames={{
                            inputWrapper: "bg-zinc-900 border border-zinc-800 h-12 shadow-none",
                            input: "text-base"
                        }}
                    />
                    <Button isIconOnly color="primary" className="h-12 w-12" onPress={onOpen}><FaPlus /></Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
                {filtered.length === 0 && (
                    <div className="text-center py-10 text-zinc-500">
                        No hay productos. Agrega uno con el botón +
                    </div>
                )}
                {filtered.map(p => (
                    <div key={p.id} className="bg-zinc-910 p-4 rounded-xl flex justify-between items-center border border-zinc-800/50 shadow-sm active:scale-[0.99] transition-transform">
                        <div>
                            <p className="font-bold text-white text-base">{p.name}</p>
                            <p className="text-sm text-zinc-400 mt-1">
                                <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 mr-2">Stock: {p.stock}</span>
                                <span className="text-emerald-400 font-bold">S/. {Number(p.price).toFixed(2)}</span>
                            </p>
                        </div>
                        <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => handleDelete(p.id)}>
                            <FaTrash />
                        </Button>
                    </div>
                ))}
            </div>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="bottom-center" backdrop="blur">
                <ModalContent className="bg-zinc-900 text-white border border-zinc-700 m-2 rounded-2xl">
                    {(onClose) => (
                        <>
                            <ModalHeader className="border-b border-white/5">Nuevo Producto</ModalHeader>
                            <ModalBody className="py-6">
                                <Input
                                    label="Nombre del Producto"
                                    placeholder="Ej. Gaseosa 3L"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    variant="bordered"
                                    classNames={{ inputWrapper: "border-zinc-700" }}
                                />
                                <div className="flex gap-3">
                                    <Input
                                        label="Precio (S/.)"
                                        type="number"
                                        value={newPrice}
                                        onChange={e => setNewPrice(e.target.value)}
                                        variant="bordered"
                                        classNames={{ inputWrapper: "border-zinc-700" }}
                                    />
                                    <Input
                                        label="Stock"
                                        type="number"
                                        value={newStock}
                                        onChange={e => setNewStock(e.target.value)}
                                        variant="bordered"
                                        classNames={{ inputWrapper: "border-zinc-700" }}
                                    />
                                </div>
                            </ModalBody>
                            <ModalFooter className="border-t border-white/5">
                                <Button color="danger" variant="light" onPress={onClose} className="font-medium">Cancelar</Button>
                                <Button color="primary" onPress={() => handleCreate(onClose)} isLoading={loading} className="font-bold">Guardar Producto</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
export default ExpressInventory;
