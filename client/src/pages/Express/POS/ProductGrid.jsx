import { useState, useEffect } from "react";
import { Input, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Spinner } from "@heroui/react";
import { Search, PackageX, Plus, Minus, History, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import { getSales, getSaleDetails } from "@/services/express.services";

export const ProductGrid = ({ products, cart, onAdd, onRemove, loading }) => {
    const [search, setSearch] = useState("");
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [salesHistory, setSalesHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null); // For detail view

    const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    const handleAdd = (p, currentQty) => {
        if (currentQty >= p.stock) {
            toast.error(`Stock insuficiente. Solo quedan ${p.stock}`);
            return;
        }
        onAdd(p);
    };

    const loadHistory = async () => {
        setLoadingHistory(true);
        try {
            const data = await getSales();
            setSalesHistory(data);
            setSelectedSale(null); // Reset detail view
        } catch (e) {
            toast.error("Error cargando historial");
        } finally {
            setLoadingHistory(false);
        }
    };

    const openHistory = () => {
        loadHistory();
        onOpen();
    };

    const openSaleDetails = async (sale) => {
        setLoadingHistory(true);
        try {
            const details = await getSaleDetails(sale.id);
            setSelectedSale(details);
        } catch (e) {
            toast.error("Error cargando detalles");
        } finally {
            setLoadingHistory(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Search Bar & History */}
            <div className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-xl pb-2 flex gap-3">
                <Input
                    placeholder="Buscar producto..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    startContent={<Search className="text-zinc-500 w-5 h-5" />}
                    classNames={{
                        inputWrapper: "bg-zinc-900/50 border border-white/10 h-14 rounded-2xl hover:bg-zinc-900 transition-colors group-data-[focus=true]:bg-zinc-900 mb-2 font-medium text-lg",
                        base: "flex-1"
                    }}
                />
                <Button
                    isIconOnly
                    className="h-14 w-14 bg-zinc-900 border border-white/10 rounded-2xl text-zinc-400 hover:text-white"
                    onPress={openHistory}
                >
                    <History size={24} />
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" color="success" />
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 pb-36 md:pb-0">
                    {filtered.map(p => {
                        const qtyInCart = cart[p.id]?.qty || 0;
                        const isOutOfStock = p.stock <= 0;

                        return (
                            <div
                                key={p.id}
                                className={`
                                relative flex flex-col items-start text-left p-4 md:p-6 min-h-[14rem] md:min-h-[16rem] rounded-[2rem] md:rounded-[2.5rem] border transition-all duration-300
                                ${isOutOfStock ? 'opacity-50 grayscale border-zinc-800 bg-zinc-900' : ''}
                                ${qtyInCart > 0
                                        ? 'bg-emerald-950/30 border-emerald-500/50 ring-1 ring-emerald-500/50'
                                        : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-900'}
                            `}
                                onClick={() => !isOutOfStock && handleAdd(p, qtyInCart)}
                            >
                                {/* Stock Badge */}
                                {isOutOfStock && (
                                    <div className="absolute top-4 right-4 md:top-6 md:right-6 text-red-500 z-10">
                                        <PackageX className="w-6 h-6 md:w-7 md:h-7" />
                                    </div>
                                )}

                                {/* Info Section */}
                                <div className="flex-1 w-full z-0 relative">
                                    <p className={`font-bold text-sm md:text-xl leading-snug line-clamp-2 md:line-clamp-3 mb-2 md:mb-3 pr-4 md:pr-6 ${qtyInCart > 0 ? 'text-emerald-300' : 'text-zinc-100'}`}>
                                        {p.name}
                                    </p>
                                    <p className="text-xs md:text-base text-zinc-500 font-medium">Stock: {p.stock}</p>
                                </div>

                                {/* Bottom Section: Price & Controls */}
                                <div className="w-full mt-auto pt-3 md:pt-4 flex flex-col gap-3 md:gap-4">
                                    {/* Price */}
                                    <div className="flex flex-col">
                                        <span className="text-[10px] md:text-xs text-zinc-500 font-normal uppercase tracking-wider">Precio</span>
                                        <span className={`text-xl md:text-3xl font-black tracking-tight ${qtyInCart > 0 ? 'text-emerald-400' : 'text-white'}`}>
                                            <span className="text-xs md:text-base font-normal text-zinc-500 mr-1">S/.</span>
                                            {Number(p.price).toFixed(2)}
                                        </span>
                                    </div>

                                    {/* Controls (Aligned Right) */}
                                    <div className="self-end">
                                        {qtyInCart > 0 ? (
                                            <div
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex items-center gap-2 md:gap-4 bg-emerald-500 rounded-full px-2 py-1 md:px-3 md:py-2 shadow-xl shadow-emerald-500/30 animate-in zoom-in spin-in-1 duration-300"
                                            >
                                                <button
                                                    onClick={() => onRemove(p.id)}
                                                    className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center bg-emerald-700/80 rounded-full text-white hover:bg-emerald-800 active:scale-90 transition-all"
                                                >
                                                    <Minus className="w-4 h-4 md:w-6 md:h-6" strokeWidth={3} />
                                                </button>
                                                <span className="font-bold text-white text-lg md:text-2xl min-w-[20px] md:min-w-[28px] text-center">{qtyInCart}</span>
                                                <button
                                                    onClick={() => handleAdd(p, qtyInCart)}
                                                    className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center bg-white text-emerald-600 rounded-full hover:bg-zinc-100 active:scale-90 transition-all"
                                                >
                                                    <Plus className="w-4 h-4 md:w-6 md:h-6" strokeWidth={3} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                disabled={isOutOfStock}
                                                onClick={(e) => { e.stopPropagation(); handleAdd(p, qtyInCart); }}
                                                className={`w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all ${isOutOfStock ? 'hidden' : 'bg-zinc-800 text-white hover:bg-emerald-500 hover:text-white active:scale-90 shadow-lg'}`}
                                            >
                                                <Plus className="w-5 h-5 md:w-8 md:h-8" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Sales History Modal */}
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                placement="center"
                classNames={{
                    base: "bg-zinc-950 border border-white/10 rounded-3xl",
                    backdrop: "bg-black/80 backdrop-blur-sm",
                }}
            >
                <ModalContent>
                    {(onClose) => {
                        return (
                            <>
                                <ModalHeader className="flex flex-col gap-1 border-b border-white/5 py-4">
                                    <div className="flex items-center gap-2">
                                        {selectedSale && (
                                            <button
                                                onClick={() => setSelectedSale(null)}
                                                className="p-1 -ml-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                                            >
                                                <ChevronLeft size={20} />
                                            </button>
                                        )}
                                        <div>
                                            <h2 className="text-xl font-bold text-white">
                                                {selectedSale ? `Venta #${selectedSale.id}` : 'Historial de Ventas'}
                                            </h2>
                                            <p className="text-sm text-zinc-500">
                                                {selectedSale ? 'Detalle de transaction' : 'Últimas transacciones realizadas'}
                                            </p>
                                        </div>
                                    </div>
                                </ModalHeader>
                                <ModalBody className="py-0 px-0 max-h-[60vh] overflow-y-auto">
                                    {loadingHistory ? (
                                        <div className="py-10 text-center text-zinc-500">Cargando...</div>
                                    ) : selectedSale ? (
                                        // DETAIL VIEW
                                        <div className="p-4 space-y-4">
                                            <div className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                                                <div>
                                                    <p className="text-xs text-zinc-500">Fecha</p>
                                                    <p className="text-white font-medium">
                                                        {new Date(selectedSale.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-zinc-500">Método de Pago</p>
                                                    <p className="text-emerald-400 font-bold uppercase">{selectedSale.payment_method}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="text-sm text-zinc-400 font-medium ml-1">Productos</h3>
                                                <div className="space-y-2">
                                                    {selectedSale.items?.map((item, idx) => (
                                                        <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-zinc-900/30">
                                                            <div>
                                                                <p className="text-zinc-200 text-sm font-medium">{item.name}</p>
                                                                <p className="text-xs text-zinc-500">{item.quantity} x S/. {Number(item.price).toFixed(2)}</p>
                                                            </div>
                                                            <p className="text-white font-bold text-sm">
                                                                S/. {(item.quantity * Number(item.price)).toFixed(2)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="border-t border-white/10 pt-4 flex justify-between items-end">
                                                <span className="text-zinc-400 text-lg">Total</span>
                                                <span className="text-3xl font-black text-emerald-400">
                                                    S/. {Number(selectedSale.total).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        // LIST VIEW
                                        salesHistory.length === 0 ? (
                                            <div className="py-10 text-center text-zinc-500">No hay ventas registradas.</div>
                                        ) : (
                                            <div className="divide-y divide-white/5">
                                                {salesHistory.map((sale) => (
                                                    <div
                                                        key={sale.id}
                                                        onClick={() => openSaleDetails(sale)}
                                                        className="p-4 flex justify-between items-center hover:bg-zinc-900/50 transition-colors cursor-pointer group"
                                                    >
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-white font-bold group-hover:text-amber-400 transition-colors">Venta #{sale.id}</p>
                                                                <ChevronRight size={14} className="text-zinc-600 group-hover:translate-x-1 transition-transform" />
                                                            </div>
                                                            <p className="text-xs text-zinc-500">
                                                                {new Date(sale.created_at).toLocaleDateString()} - {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-emerald-400 font-bold">S/. {Number(sale.total).toFixed(2)}</p>
                                                            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{sale.payment_method}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    )}
                                </ModalBody>
                                <ModalFooter className="border-t border-white/5 p-4">
                                    <Button className="w-full bg-zinc-900 text-white font-medium" onPress={onClose}>
                                        Cerrar
                                    </Button>
                                </ModalFooter>
                            </>
                        );
                    }}
                </ModalContent>
            </Modal>
        </div>
    );
};
