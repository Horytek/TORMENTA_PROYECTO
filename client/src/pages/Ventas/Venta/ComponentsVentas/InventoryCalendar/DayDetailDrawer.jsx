import React, { useMemo } from 'react';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    Button,
    ScrollShadow
} from "@heroui/react";
import { FaBoxOpen, FaCalendarAlt } from "react-icons/fa";

const DayDetailDrawer = ({ isOpen, onClose, day, products }) => {

    const aggregatedProducts = useMemo(() => {
        if (!products) return [];
        return products.sort((a, b) => b.cantidad - a.cantidad);
    }, [products]);

    const totalQuantity = products ? products.reduce((acc, curr) => acc + curr.cantidad, 0) : 0;
    const totalRevenue = products ? products.reduce((acc, curr) => acc + parseFloat(curr.subtotal.replace('S/ ', '').replace('S/', '')), 0) : 0;

    return (
        <Drawer isOpen={isOpen} onOpenChange={onClose} placement="right" size="lg" backdrop="blur">
            <DrawerContent>
                {(onClose) => (
                    <>
                        <DrawerHeader className="flex flex-col gap-1 border-b border-default-200">
                            <div className="flex items-center gap-2 text-xl font-bold text-default-800">
                                <FaCalendarAlt className="text-primary-500" />
                                Día {day}
                            </div>
                            <p className="text-sm text-default-500">
                                Resumen de productos vendidos y movimiento de inventario.
                            </p>
                        </DrawerHeader>
                        <DrawerBody className="p-0">
                            <div className="grid grid-cols-2 gap-4 p-4 bg-default-50">
                                <div className="bg-white p-3 rounded-lg border border-default-200 shadow-sm">
                                    <p className="text-xs text-default-500 uppercase font-bold">Total Productos</p>
                                    <p className="text-2xl font-bold text-primary-600">{totalQuantity}</p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-default-200 shadow-sm">
                                    <p className="text-xs text-default-500 uppercase font-bold">Total Ventas</p>
                                    <p className="text-2xl font-bold text-success-600">S/ {totalRevenue.toFixed(2)}</p>
                                </div>
                            </div>

                            <ScrollShadow className="h-full p-4">
                                <div className="space-y-3">
                                    {aggregatedProducts.map((product, idx) => (
                                        <div key={`${product.codigo}-${idx}`} className="flex items-center justify-between p-3 bg-white rounded-lg border border-default-100 shadow-sm hover:border-primary-300 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                                                    <FaBoxOpen />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-default-700 text-sm line-clamp-1">{product.nombre}</p>
                                                    <p className="text-xs text-default-400">{product.codigo} - {product.nom_marca || 'Sin Marca'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-default-800 text-lg">{product.cantidad}</p>
                                                <p className="text-xs text-default-400">UND</p>
                                            </div>
                                        </div>
                                    ))}
                                    {aggregatedProducts.length === 0 && (
                                        <div className="text-center py-10 text-default-400">
                                            No hay productos registrados para este día.
                                        </div>
                                    )}
                                </div>
                            </ScrollShadow>
                        </DrawerBody>
                        <DrawerFooter className="border-t border-default-200">
                            <Button color="danger" variant="light" onPress={onClose}>
                                Cerrar
                            </Button>
                        </DrawerFooter>
                    </>
                )}
            </DrawerContent>
        </Drawer>
    );
};

export default DayDetailDrawer;
