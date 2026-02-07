import { useEffect, useState } from "react";
import { getProducts, createSale } from "@/services/express.services";
import { Modal, ModalContent, ModalBody, useDisclosure, Button } from "@heroui/react";
import { ProductGrid } from "./POS/ProductGrid";
import { CartPanel } from "./POS/CartPanel";
import { ShoppingBag } from "lucide-react";
import { toast } from "react-hot-toast";

function ExpressPOS() {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState({}); // { id: { ...product, qty } }

    // Mobile Cart Modal
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [loading, setLoading] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(true);

    useEffect(() => { loadProducts(); }, []);

    const loadProducts = async () => {
        setLoadingProducts(true);
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (e) { console.error(e); }
        finally { setLoadingProducts(false); }
    };

    const addToCart = (product) => {
        setCart(prev => {
            const current = prev[product.id];
            const currentQty = current?.qty || 0;

            // Stock Validation (Double Check)
            if (currentQty >= product.stock) {
                toast.error(`No hay más stock disponible.`);
                return prev;
            }

            return {
                ...prev,
                [product.id]: {
                    ...product,
                    qty: currentQty + 1
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

    const clearCart = () => setCart({});

    const handleCheckout = async () => {
        setLoading(true);
        const cartList = Object.values(cart);
        try {
            const payload = {
                cart: cartList.map(item => ({ product_id: item.id, quantity: item.qty, price: item.price })),
                payment_method: 'Efectivo'
            };
            await createSale(payload);
            setCart({});
            await loadProducts(); // Refresh stock AND show loading!
            toast.success("Venta realizada con éxito!");
            // Close mobile modal if open
            onOpenChange(false);
        } catch (e) {
            toast.error(e.message || "Error al procesar venta");
        } finally { setLoading(false); }
    };

    const cartList = Object.values(cart);
    const count = cartList.reduce((sum, item) => sum + item.qty, 0);
    const total = cartList.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);

    return (
        <div className="h-full flex flex-col lg:flex-row bg-zinc-950 overflow-hidden">
            {/* LEFT: Product Area */}
            <div className="flex-1 h-full overflow-y-auto p-4 scrollbar-hide relative">
                <ProductGrid
                    products={products}
                    cart={cart}
                    onAdd={addToCart}
                    onRemove={removeFromCart}
                    loading={loadingProducts}
                />
            </div>

            {/* RIGHT: Cart Panel (Desktop Only) */}
            <div className="hidden lg:flex w-[400px] h-full shadow-2xl relative z-20">
                <CartPanel
                    cart={cart}
                    onAdd={addToCart}
                    onRemove={removeFromCart}
                    onClear={clearCart}
                    onCheckout={handleCheckout}
                    loading={loading}
                />
            </div>

            {/* MOBILE: Floating Button */}
            <div className="lg:hidden fixed bottom-32 left-4 right-4 z-40">
                {count > 0 && (
                    <Button
                        className="w-full h-16 bg-amber-500 text-black font-black text-lg shadow-[0_10px_40px_-10px_rgba(245,158,11,0.5)] rounded-full animate-in slide-in-from-bottom-5"
                        onPress={onOpen}
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-black/20 w-8 h-8 rounded-lg flex items-center justify-center text-sm">
                                {count}
                            </div>
                            <span>Ver Carrito</span>
                        </div>
                        <span className="text-xl">S/. {total.toFixed(2)}</span>
                    </Button>
                )}
            </div>

            {/* MOBILE: Cart Modal */}
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                placement="bottom"
                size="full"
                classNames={{
                    base: "h-[90vh] rounded-t-[40px] bg-transparent shadow-none",
                    wrapper: "z-[9999]",
                    backdrop: "bg-black/80 backdrop-blur-sm"
                }}
                motionProps={{
                    variants: {
                        enter: { y: 0, transition: { duration: 0.3, ease: "easeOut" } },
                        exit: { y: "100%", transition: { duration: 0.2, ease: "easeIn" } },
                    }
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <ModalBody className="p-0 h-full overflow-hidden bg-zinc-950 rounded-t-[40px] border-t border-white/10 relative">
                            {/* Drag handle visual */}
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-zinc-800 rounded-full z-50" />

                            <CartPanel
                                cart={cart}
                                onAdd={addToCart}
                                onRemove={removeFromCart}
                                onClear={clearCart}
                                onCheckout={() => handleCheckout(onClose)}
                                loading={loading}
                            />
                        </ModalBody>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}

export default ExpressPOS;
