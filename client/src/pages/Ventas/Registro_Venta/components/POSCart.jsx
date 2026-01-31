import React from 'react';
import { Card, Button, ScrollShadow, Divider, Select, SelectItem, Autocomplete, AutocompleteItem } from "@heroui/react";
import { Trash2, Plus, Minus, CreditCard, ShoppingCart } from "lucide-react";
import { useClientesData } from "@/services/ventas.services";
import PaymentModal from './PaymentModal';
import AddClientModal from '@/pages/Clientes/ComponentsClientes/AddClient';
import { toast } from 'react-hot-toast';

const POSCart = ({ pos }) => {
    const {
        cart,
        totals,
        removeFromCart,
        updateQuantity,
        clearCart,
        client,
        setClient,
        documentType,
        setDocumentType,
        submitSale // New Function
    } = pos;

    const { clientes, setClientes } = useClientesData();
    const [isPaymentOpen, setIsPaymentOpen] = React.useState(false);
    const [isAddClientOpen, setIsAddClientOpen] = React.useState(false);
    const [resetKey, setResetKey] = React.useState(0);
    const prevClientRef = React.useRef(client);

    // Force Autocomplete reset when client is cleared programmatically
    React.useEffect(() => {
        if (prevClientRef.current && !client) {
            setResetKey(prev => prev + 1);
        }
        prevClientRef.current = client;
    }, [client]);

    const handleCheckout = () => {
        // 1. Validation: Empty Cart
        if (cart.length === 0) {
            toast.error("El carrito está vacío sin productos.");
            return;
        }

        // 2. Validation: Client Requirements for 'Factura'
        // IMPORTANT: SUNAT only accepts RUC (11 digits) for Factura, NOT DNI
        if (documentType === 'Factura') {
            if (!client) {
                toast.error("Para emitir FACTURA, es obligatorio seleccionar un Cliente.");
                return;
            }
            const docLen = client.documento?.length || 0;
            // Factura REQUIRES RUC (11 digits) - SUNAT Error 2800 if using DNI
            if (docLen !== 11) {
                toast.error("Para FACTURA, el cliente debe tener RUC válido (11 dígitos). Para DNI use BOLETA.");
                return;
            }
        }

        // 3. Validation: SUNAT Rule for 'Boleta' > S/ 700
        if (documentType === 'Boleta' && totals.total >= 700 && !client) {
            toast.error("Para montos mayores a S/ 700 en BOLETA, es obligatorio identificar al cliente (Normativa SUNAT).");
            return;
        }

        setIsPaymentOpen(true);
    };

    const handlePaymentConfirm = async (paymentDetails, observacion) => {
        const success = await submitSale(paymentDetails, observacion);
        if (success) {
            setIsPaymentOpen(false);
        }
    };

    return (
        <Card className="h-full shadow-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
            {/* 1. Header: Sale Info */}
            <div className="p-4 bg-slate-50 dark:bg-zinc-950/50 border-b border-slate-100 dark:border-zinc-800 space-y-3">
                <div className="flex gap-2 items-center">
                    <Select
                        selectedKeys={[documentType]}
                        onSelectionChange={(k) => setDocumentType(Array.from(k)[0])}
                        size="sm"
                        className="w-1/3"
                        classNames={{ trigger: "bg-white dark:bg-zinc-900 shadow-sm" }}
                    >
                        <SelectItem key="Boleta">Boleta</SelectItem>
                        <SelectItem key="Factura">Factura</SelectItem>
                        <SelectItem key="Nota de venta">Nota de Venta</SelectItem>
                    </Select>

                    <div className="flex-1 flex gap-1">
                        <Autocomplete
                            key={resetKey}
                            placeholder="Cliente (DNI/RUC)"
                            defaultItems={clientes}
                            className="flex-1"
                            size="sm"
                            inputProps={{
                                classNames: { inputWrapper: "bg-white dark:bg-zinc-900 shadow-sm" }
                            }}
                            onSelectionChange={(key) => {
                                if (!key) {
                                    setClient(null);
                                    return;
                                }
                                const c = clientes.find(cl => cl.id == key);
                                setClient(c);
                            }}
                        >
                            {(item) => <AutocompleteItem key={item.id} textValue={item.nombre}>{item.nombre}</AutocompleteItem>}
                        </Autocomplete>
                        <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            color="primary"
                            onPress={() => setIsAddClientOpen(true)}
                        >
                            <Plus size={16} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* 2. Cart List */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
                <div className="px-4 py-2 bg-slate-100 dark:bg-zinc-800/50 text-xs font-semibold text-slate-500 flex uppercase tracking-wider">
                    <span className="w-16 text-center">Cant.</span>
                    <span className="flex-1 px-2">Producto</span>
                    <span className="w-20 text-right">Total</span>
                    <span className="w-8"></span>
                </div>

                <ScrollShadow className="flex-1 p-2">
                    {cart.length > 0 ? (
                        <div className="space-y-1">
                            {cart.map((item) => (
                                <div key={item.uniqueKey} className="group flex items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-zinc-800">
                                    {/* Quantity Controls */}
                                    <div className="w-16 flex items-center justify-center gap-1 bg-slate-100 dark:bg-zinc-800 rounded-lg p-1 h-8">
                                        <button
                                            className="w-5 h-full flex items-center justify-center hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors text-slate-600"
                                            onClick={() => updateQuantity(item.uniqueKey, item.cantidad - 1, item.codigo)}
                                        >
                                            <Minus size={12} strokeWidth={3} />
                                        </button>
                                        <span className="flex-1 text-center font-bold text-sm text-slate-800 dark:text-slate-200">{item.cantidad}</span>
                                        <button
                                            className="w-5 h-full flex items-center justify-center hover:bg-white dark:hover:bg-zinc-700 rounded transition-colors text-blue-600"
                                            onClick={() => updateQuantity(item.uniqueKey, item.cantidad + 1, item.codigo)}
                                        >
                                            <Plus size={12} strokeWidth={3} />
                                        </button>
                                    </div>

                                    {/* Name & Variants */}
                                    <div className="flex-1 px-3 flex flex-col justify-center">
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 line-clamp-1 leading-tight">
                                            {item.nombre}
                                        </span>
                                        {/* Display Variant Info */}
                                        {/* Display Variant Info */}
                                        {(item.resolvedAttributes?.length > 0 || item.sku_label || item.nombre_tonalidad || item.nombre_talla) && (
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                                {item.resolvedAttributes?.length > 0 ? (
                                                    item.resolvedAttributes.map((attr, idx) => (
                                                        <span key={idx} className="text-[10px] bg-slate-200 dark:bg-zinc-700 px-1.5 rounded text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                                                            {attr.label}: {attr.value}
                                                        </span>
                                                    ))
                                                ) : item.sku_label ? (
                                                    <span className="text-[10px] bg-slate-200 dark:bg-zinc-700 px-1.5 rounded text-slate-600 dark:text-slate-300 font-medium">
                                                        {item.sku_label}
                                                    </span>
                                                ) : (
                                                    <>
                                                        {item.nombre_talla && item.nombre_talla !== 'U' && (
                                                            <span className="text-[10px] bg-slate-200 dark:bg-zinc-700 px-1.5 rounded text-slate-600 dark:text-slate-300">
                                                                T: {item.nombre_talla}
                                                            </span>
                                                        )}
                                                        {item.nombre_tonalidad && item.nombre_tonalidad !== 'Sin Tonalidad' && (
                                                            <span className="text-[10px] bg-slate-200 dark:bg-zinc-700 px-1.5 rounded text-slate-600 dark:text-slate-300">
                                                                C: {item.nombre_tonalidad}
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                            S/ {item.precio} u.
                                        </span>
                                    </div>

                                    {/* Subtotal */}
                                    <div className="w-20 text-right font-bold text-slate-900 dark:text-slate-100 text-sm">
                                        S/ {(item.cantidad * item.precio * (1 - (item.descuento || 0) / 100)).toFixed(2)}
                                    </div>

                                    {/* Remove */}
                                    <div className="w-8 flex justify-end">
                                        <button
                                            onClick={() => removeFromCart(item.uniqueKey, item.cantidad, item.codigo)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-zinc-700 select-none">
                            <ShoppingCart size={48} className="mb-2 opacity-20" />
                            <p className="font-medium">Carrito vacío</p>
                        </div>
                    )}
                </ScrollShadow>
            </div>

            {/* 3. Footer: Totals & Action */}
            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>Subtotal</span>
                        <span>S/ {totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                        <span>IGV (18%)</span>
                        <span>S/ {totals.igv.toFixed(2)}</span>
                    </div>
                    <Divider className="my-2" />
                    <div className="flex justify-between items-end">
                        <span className="text-lg font-bold text-slate-800 dark:text-white">Total a Pagar</span>
                        <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-500 tracking-tight">
                            S/ {totals.total.toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                    <Button
                        variant="flat"
                        color="danger"
                        className="col-span-1 rounded-xl h-12"
                        onPress={clearCart}
                        isDisabled={cart.length === 0}
                    >
                        <Trash2 size={20} />
                    </Button>
                    <Button
                        className={`col-span-3 rounded-xl h-12 font-bold text-md ${cart.length === 0 || !client || !documentType
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed shadow-none'
                            : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                            }`}
                        color={cart.length === 0 || !client || !documentType ? "default" : "primary"}
                        startContent={<CreditCard size={20} />}
                        onPress={handleCheckout}
                        isDisabled={cart.length === 0 || !client || !documentType}
                    >
                        Cobrar (F12)
                    </Button>
                </div>
            </div>

            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                total={totals.total}
                onConfirm={handlePaymentConfirm}
                documentType={documentType}
            />

            <AddClientModal
                open={isAddClientOpen}
                onClose={() => setIsAddClientOpen(false)}
                setAllClientes={setClientes} // Pass setter to update list locally
            />
        </Card>
    );
};

export default POSCart;
