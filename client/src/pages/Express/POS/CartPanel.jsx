import { Button, ScrollShadow } from "@heroui/react";
import { Trash2, Minus, Plus, ShoppingBag, CreditCard } from "lucide-react";

export const CartPanel = ({ cart, onAdd, onRemove, onClear, onCheckout, loading }) => {
    const cartList = Object.values(cart);
    const total = cartList.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);
    const count = cartList.reduce((sum, item) => sum + item.qty, 0);

    return (
        <div className="flex flex-col h-full bg-zinc-900/50 backdrop-blur-xl border-l border-white/5 md:w-[380px] w-full">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-950/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <ShoppingBag size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-white">Carrito</h2>
                        <p className="text-xs text-zinc-500">{count} productos</p>
                    </div>
                </div>
                {count > 0 && (
                    <button
                        onClick={onClear}
                        className="p-2 hover:bg-red-500/10 text-red-500/50 hover:text-red-500 rounded-xl transition-colors"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
            </div>

            {/* List */}
            <ScrollShadow className="flex-1 p-4 space-y-3">
                {cartList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4">
                        <ShoppingBag size={48} className="opacity-20" />
                        <p className="text-sm font-medium">Carrito está vacío</p>
                    </div>
                ) : (
                    cartList.map(item => (
                        <div key={item.id} className="flex gap-4 p-3 rounded-2xl bg-zinc-900 border border-white/5 group hover:border-white/10 transition-colors">
                            {/* Image Placeholder (future) */}
                            <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-600">
                                {item.name.substring(0, 2).toUpperCase()}
                            </div>

                            <div className="flex-1 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <p className="font-bold text-sm text-zinc-200 line-clamp-1">{item.name}</p>
                                    <p className="font-bold text-sm text-white">S/. {(item.price * item.qty).toFixed(2)}</p>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-xs text-zinc-500">S/. {Number(item.price).toFixed(2)} c/u</p>

                                    {/* Qtys */}
                                    <div className="flex items-center bg-zinc-950 rounded-lg p-0.5 border border-white/5">
                                        <button
                                            onClick={() => onRemove(item.id)}
                                            className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                        >
                                            <Minus size={12} />
                                        </button>
                                        <span className="w-6 text-center text-xs font-bold font-mono">{item.qty}</span>
                                        <button
                                            onClick={() => onAdd(item)}
                                            className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </ScrollShadow>

            {/* Footer */}
            <div className="p-6 bg-zinc-950/80 border-t border-white/5 backdrop-blur-md space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-zinc-400">
                        <span>Subtotal</span>
                        <span>S/. {total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-end">
                        <span className="font-bold text-white text-lg">Total</span>
                        <span className="font-black text-3xl text-emerald-400 tracking-tighter">
                            <span className="text-sm font-normal text-emerald-500/50 mr-1">S/.</span>
                            {total.toFixed(2)}
                        </span>
                    </div>
                </div>

                <Button
                    className="w-full h-14 bg-emerald-500 text-white font-bold text-lg rounded-2xl shadow-[0_10px_30px_-10px_rgba(16,185,129,0.4)] hover:bg-emerald-400 transition-all active:scale-[0.98]"
                    startContent={<CreditCard size={20} />}
                    isDisabled={cartList.length === 0}
                    isLoading={loading}
                    onPress={onCheckout}
                >
                    Cobrar (F12)
                </Button>
            </div>
        </div>
    );
};
