import { useEffect, useState } from "react";
import { getProducts, createSale } from "@/services/express.services";
import { Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Chip } from "@heroui/react";
import { FaSearch, FaMinus, FaPlus, FaMoneyBillWave } from "react-icons/fa";

function ExpressPOS() {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState({}); // { id: { ...product, qty } }
    const [search, setSearch] = useState("");
    const { isOpen, onOpen, onOpenChange } = useDisclosure(); // Checkout Modal
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadProducts(); }, []);

    const loadProducts = async () => {
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (e) { console.error(e); }
    };

    const addToCart = (product) => {
        setCart(prev => {
            const current = prev[product.id];
            return {
                ...prev,
                [product.id]: {
                    ...product,
                    qty: (current?.qty || 0) + 1
                }
            };
        });
    };

    const removeFromCart = (productId) => {
        setCart(prev => {
            const current = prev[productId];
            if (!current) return prev;
            if (current.qty > 1) {
                return { ...prev, [productId]: { ...current, qty: current.qty - 1 } };
            } else {
                const newState = { ...prev };
                delete newState[productId];
                return newState;
            }
        });
    };

    const cartList = Object.values(cart);
    const total = cartList.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);
    const count = cartList.reduce((sum, item) => sum + item.qty, 0);

    const handleCheckout = async (onClose) => {
        setLoading(true);
        try {
            const payload = {
                cart: cartList.map(item => ({ product_id: item.id, quantity: item.qty, price: item.price })),
                payment_method: 'Efectivo'
            };
            await createSale(payload);
            setCart({});
            loadProducts(); // Refresh stock
            onClose();
            // Assuming success, user sees stock update
        } catch (e) {
            alert("Error al procesar venta");
            console.error(e);
        } finally { setLoading(false); }
    };

    const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="h-full flex flex-col relative pb-24">
            {/* Search Bar */}
            <div className="sticky top-0 bg-zinc-950/90 py-2 z-10 mb-2 backdrop-blur-md">
                <Input
                    placeholder="Buscar producto..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    startContent={<FaSearch className="text-zinc-500" />}
                    classNames={{ inputWrapper: "bg-zinc-900 border border-zinc-800 h-12" }}
                />
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 gap-3">
                {filtered.map(p => {
                    const qtyInCart = cart[p.id]?.qty || 0;
                    return (
                        <button
                            key={p.id}
                            className={`p-4 rounded-xl border text-left transition-all active:scale-[0.98] relative overflow-hidden ${qtyInCart > 0 ? 'bg-amber-500/10 border-amber-500' : 'bg-zinc-900 border-zinc-800'}`}
                            onClick={() => addToCart(p)}
                        >
                            {/* Stock status indicator */}
                            {p.stock <= 0 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px] font-bold text-red-500">AGOTADO</div>}

                            <p className="font-bold text-white line-clamp-2 min-h-[40px] leading-snug">{p.name}</p>
                            <div className="flex justify-between items-end mt-2">
                                <span className="text-emerald-400 font-bold text-lg">S/. {Number(p.price).toFixed(2)}</span>
                                {qtyInCart > 0 && <Chip size="sm" className="bg-amber-500 text-black font-bold h-6">{qtyInCart}</Chip>}
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Floating Checkout Bar */}
            {count > 0 && (
                <div className="fixed bottom-20 left-4 right-4 z-40 animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <Button
                        className="w-full h-14 bg-amber-500 hover:bg-amber-400 text-black font-black shadow-xl shadow-amber-500/20 text-lg flex justify-between px-6 rounded-full"
                        onPress={onOpen}
                    >
                        <div className="flex items-center gap-2">
                            <span className="bg-black/20 px-2 py-0.5 rounded text-sm">{count} items</span>
                            <span>Cobrar</span>
                        </div>
                        <span>S/. {total.toFixed(2)}</span>
                    </Button>
                </div>
            )}

            {/* Checkout Modal */}
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                scrollBehavior="inside"
                placement="bottom"
                size="full"
                classNames={{
                    base: "h-[90vh] rounded-t-3xl bg-zinc-950",
                    closeButton: "hover:bg-white/5 active:bg-white/10",
                }}
                motionProps={{
                    variants: {
                        enter: { y: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
                        exit: { y: 100, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } },
                    }
                }}
            >
                <ModalContent className="bg-zinc-950 text-white">
                    {(onClose) => (
                        <>
                            <ModalHeader className="border-b border-zinc-800 flex justify-between items-center py-4">
                                <div className="flex flex-col">
                                    <span className="text-xl">Carrito de Venta</span>
                                    <span className="text-xs text-zinc-500 font-normal">{count} productos agregados</span>
                                </div>
                                <Button size="sm" color="danger" variant="flat" onPress={() => setCart({})}>Vaciar</Button>
                            </ModalHeader>
                            <ModalBody className="p-4">
                                <div className="space-y-3">
                                    {cartList.map(item => (
                                        <div key={item.id} className="flex justify-between items-center bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                                            <div className="flex-1 pr-2">
                                                <p className="font-bold text-white text-sm">{item.name}</p>
                                                <p className="text-emerald-400 text-xs font-semibold">S/. {Number(item.price).toFixed(2)} c/u</p>
                                            </div>
                                            <div className="flex items-center gap-3 bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                                                <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center text-white active:bg-zinc-700 transition-colors"><FaMinus size={10} /></button>
                                                <span className="font-bold w-6 text-center text-sm">{item.qty}</span>
                                                <button onClick={() => addToCart(item)} className="w-8 h-8 rounded-md bg-amber-500 text-black flex items-center justify-center active:bg-amber-600 transition-colors"><FaPlus size={10} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ModalBody>
                            <ModalFooter className="border-t border-zinc-800 bg-zinc-900 p-6 safe-area-bottom">
                                <div className="w-full flex flex-col gap-4">
                                    <div className="flex justify-between text-xl font-bold">
                                        <span className="text-zinc-400">Total a Pagar</span>
                                        <span className="text-emerald-400 text-2xl">S/. {total.toFixed(2)}</span>
                                    </div>
                                    <Button
                                        className="w-full bg-emerald-500 font-bold text-lg h-14 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                                        startContent={<FaMoneyBillWave />}
                                        onPress={() => handleCheckout(onClose)}
                                        isLoading={loading}
                                    >
                                        Confirmar Pago (Efectivo)
                                    </Button>
                                </div>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}

export default ExpressPOS;
