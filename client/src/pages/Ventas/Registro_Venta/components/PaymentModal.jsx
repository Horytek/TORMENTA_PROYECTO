import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem, Chip, Textarea } from "@heroui/react";
import { Printer, Plus, Trash2, CreditCard, Banknote, Smartphone } from "lucide-react";
import { toast } from 'react-hot-toast';

const PaymentModal = ({ isOpen, onClose, total, onConfirm, documentType }) => {
    const [payments, setPayments] = useState([{ method: "EFECTIVO", amount: "" }]);
    const [observacion, setObservacion] = useState("");

    const isNotaVenta = documentType === "Nota de venta" || documentType === "Nota";

    // Icons map for visualization
    const icons = {
        EFECTIVO: <Banknote size={18} />,
        PLIN: <Smartphone size={18} className="text-pink-500" />,
        YAPE: <Smartphone size={18} className="text-purple-600" />,
        VISA: <CreditCard size={18} className="text-blue-600" />
    };

    // Initialize/Reset State
    useEffect(() => {
        if (isOpen) {
            setObservacion("");
            // Default to full amount in Cash
            setPayments([{ method: "EFECTIVO", amount: total.toFixed(2) }]);
        }
    }, [isOpen, total, documentType]);

    // Derived values
    const totalPaid = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
    const change = Math.max(0, totalPaid - total);
    const remaining = Math.max(0, total - totalPaid);
    const isSufficient = totalPaid >= total - 0.01; // Tolerance for float

    // Actions
    // List of all available methods
    const ALL_METHODS = ["EFECTIVO", "YAPE", "PLIN", "VISA", "TRANSFERENCIA"];

    // Helper: Get next available method that isn't currently used
    const getNextAvailableMethod = (currentPayments) => {
        const used = currentPayments.map(p => p.method);
        return ALL_METHODS.find(m => !used.includes(m)) || "EFECTIVO";
    };

    // Actions
    const addPaymentMethod = () => {
        if (remaining <= 0) return;
        const nextMethod = getNextAvailableMethod(payments);
        setPayments([...payments, { method: nextMethod, amount: remaining.toFixed(2) }]);
    };

    const removePaymentMethod = (index) => {
        const newPayments = payments.filter((_, i) => i !== index);
        setPayments(newPayments.length ? newPayments : [{ method: "EFECTIVO", amount: "" }]);
    };

    const updatePayment = (index, field, value) => {
        const newPayments = [...payments];
        newPayments[index] = { ...newPayments[index], [field]: value };
        setPayments(newPayments);
    };

    // Agile: Quick Cash with Auto-Split
    const handleQuickCash = (amount) => {
        const val = parseFloat(amount);

        if (isNotaVenta) {
            // Nota: Just set the single line amount
            setPayments([{ method: "EFECTIVO", amount: val.toString() }]);
            return;
        }

        if (val < total) {
            // Agile: Split! 
            // set Line 1 to val, Line 2 to remainder with NEXT AVAILABLE METHOD
            const remainder = total - val;

            // New state prediction
            const line1 = { method: "EFECTIVO", amount: val.toString() };
            const nextMethod = getNextAvailableMethod([line1]);

            setPayments([
                line1,
                { method: nextMethod, amount: remainder.toFixed(2) }
            ]);
        } else {
            // Full payment or more
            setPayments([{ method: "EFECTIVO", amount: val.toString() }]);
        }
    };

    const handleSubmit = () => {
        if (!isSufficient) {
            toast.error("El monto cubierto es insuficiente");
            return;
        }

        // Serialize payments for backend (method:amount|method:amount)
        const methodString = payments
            .map(p => `${p.method}:${parseFloat(p.amount || 0).toFixed(2)}`)
            .join('|');

        onConfirm({
            method: methodString, // format: "EFECTIVO:10.00|YAPE:20.00"
            amountReceived: totalPaid,
            change
        }, observacion);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="2xl"
            backdrop="blur"
            classNames={{
                base: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-2xl"
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50">
                    <div className="flex justify-between items-center pr-4">
                        <div>
                            <h3 className="text-xl font-bold">Procesar Pago</h3>
                            <p className="text-sm text-slate-500">
                                {isNotaVenta
                                    ? "Nota de Venta: Solo se permite pago en EFECTIVO"
                                    : "Múltiples métodos de pago permitidos"}
                            </p>
                        </div>
                        <Chip color={isSufficient ? "success" : "warning"} variant="flat">
                            {isSufficient ? "Cubierto" : `Falta: S/ ${remaining.toFixed(2)}`}
                        </Chip>
                    </div>
                </ModalHeader>

                <ModalBody className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Left: Summary */}
                    <div className="md:col-span-5 space-y-6">
                        <div className="bg-blue-600 dark:bg-blue-900/50 p-6 rounded-2xl flex flex-col items-center justify-center space-y-2 text-white shadow-lg shadow-blue-500/20">
                            <span className="text-sm font-medium opacity-80 uppercase tracking-wider">Total a Cobrar</span>
                            <span className="text-4xl font-extrabold tracking-tight">
                                S/ {total.toFixed(2)}
                            </span>
                        </div>

                        {/* Quick Cash Buttons */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rápido (Efectivo)</p>
                            <div className="grid grid-cols-2 gap-2">
                                {[10, 20, 50, 100].map(val => (
                                    <Button
                                        key={val}
                                        variant="flat"
                                        size="sm"
                                        onPress={() => handleQuickCash(val)}
                                        className="font-medium bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                                    >
                                        S/ {val}
                                    </Button>
                                ))}
                                <Button
                                    variant="flat"
                                    color="primary"
                                    className="col-span-2 font-bold"
                                    onPress={() => handleQuickCash(total)}
                                >
                                    Exacto (S/ {total.toFixed(2)})
                                </Button>
                            </div>
                        </div>

                        {/* Change Display */}
                        <div className={`p-4 rounded-xl border flex justify-between items-center transition-colors
                            ${change > 0
                                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800'
                                : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-zinc-800 dark:border-zinc-700'}`}>
                            <span className="font-semibold text-sm">Vuelto</span>
                            <span className="text-2xl font-bold">S/ {change.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Right: Payment Lines */}
                    <div className="md:col-span-7 flex flex-col h-full">
                        <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-1">
                            {payments.map((p, index) => {
                                // Calculate disabled keys: all used methods EXCEPT the current one
                                const usedMethods = payments.map(pay => pay.method);
                                const currentMethod = p.method;
                                const disabledKeys = usedMethods.filter(m => m !== currentMethod);

                                return (
                                    <div key={index} className="flex gap-2 items-start group animation-fade-in">
                                        <div className="flex-1">
                                            <div className="flex gap-2 mb-1">
                                                <Select
                                                    selectedKeys={[p.method]}
                                                    onSelectionChange={(k) => updatePayment(index, "method", Array.from(k)[0])}
                                                    isDisabled={isNotaVenta}
                                                    disabledKeys={disabledKeys}
                                                    variant="flat"
                                                    size="lg"
                                                    classNames={{ trigger: "bg-slate-100 dark:bg-zinc-800 min-h-14" }}
                                                    startContent={icons[p.method]}
                                                >
                                                    <SelectItem key="EFECTIVO" startContent={icons.EFECTIVO}>Efectivo</SelectItem>
                                                    {!isNotaVenta && <SelectItem key="PLIN" startContent={icons.PLIN}>Plin</SelectItem>}
                                                    {!isNotaVenta && <SelectItem key="YAPE" startContent={icons.YAPE}>Yape</SelectItem>}
                                                    {!isNotaVenta && <SelectItem key="VISA" startContent={icons.VISA}>Visa</SelectItem>}
                                                    {!isNotaVenta && <SelectItem key="TRANSFERENCIA" startContent={icons.VISA}>Transferencia</SelectItem>}
                                                </Select>


                                                <Input
                                                    placeholder="0.00"
                                                    value={p.amount}
                                                    onValueChange={(v) => updatePayment(index, "amount", v)}
                                                    startContent={<span className="text-slate-400 font-semibold">S/</span>}
                                                    type="number"
                                                    variant="flat"
                                                    size="lg"
                                                    classNames={{
                                                        input: "text-lg font-bold text-right",
                                                        inputWrapper: "bg-slate-100 dark:bg-zinc-800 h-14"
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Delete Button (Only if > 1 method) */}
                                        {payments.length > 1 && (
                                            <Button
                                                isIconOnly
                                                color="danger"
                                                variant="light"
                                                onPress={() => removePaymentMethod(index)}
                                                className="mt-2 text-slate-400 hover:text-red-500"
                                            >
                                                <Trash2 size={18} />
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add Method Button */}
                        {!isNotaVenta && remaining > 0 && (
                            <Button
                                size="sm"
                                variant="dashed"
                                color="primary"
                                startContent={<Plus size={16} />}
                                onPress={addPaymentMethod}
                                className="mt-4 border-dashed border-2 w-full"
                            >
                                Agregar otro método de pago
                            </Button>
                        )}

                        <div className="mt-auto pt-4">
                            <Textarea
                                label="Observación (Opcional)"
                                placeholder="Nota adicional..."
                                value={observacion}
                                onValueChange={setObservacion}
                                variant="bordered"
                                minRows={2}
                                maxRows={4}
                            />
                        </div>
                    </div>

                </ModalBody>
                <ModalFooter className="border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 p-4">
                    <Button variant="light" color="danger" onPress={onClose} size="lg">
                        Cancelar
                    </Button>
                    <Button
                        color="primary"
                        size="lg"
                        className="font-bold shadow-lg shadow-blue-500/20 min-w-[200px]"
                        isDisabled={!isSufficient}
                        startContent={<Printer size={20} />}
                        onPress={handleSubmit}
                    >
                        Confirmar e Imprimir
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default PaymentModal;
