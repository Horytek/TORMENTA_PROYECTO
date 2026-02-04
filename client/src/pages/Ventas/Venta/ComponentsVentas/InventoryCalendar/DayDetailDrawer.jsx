import React, { useMemo } from 'react';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    Button,
    ScrollShadow,
    Accordion,
    AccordionItem,
    Chip
} from "@heroui/react";
import { FaBoxOpen, FaCalendarAlt, FaTag } from "react-icons/fa";

const DayDetailDrawer = ({ isOpen, onClose, day, products }) => {

    const groupedProducts = useMemo(() => {
        if (!products) return [];

        const groups = {};

        products.forEach(product => {
            const name = product.nombre;
            if (!groups[name]) {
                groups[name] = {
                    nombre: name,
                    nom_marca: product.nom_marca || 'Sin Marca',
                    totalQty: 0,
                    totalRevenue: 0,
                    variants: []
                };
            }

            groups[name].totalQty += product.cantidad;
            // Parse subtotal robustly (handle 'S/' string or number)
            const subVal = typeof product.subtotal === 'string'
                ? parseFloat(product.subtotal.replace(/[^\d.-]/g, ''))
                : Number(product.subtotal);

            groups[name].totalRevenue += isNaN(subVal) ? 0 : subVal;
            groups[name].variants.push(product);
        });

        // Convert to array and sort by total quantity
        return Object.values(groups).sort((a, b) => b.totalQty - a.totalQty);
    }, [products]);

    const totalQuantity = products ? products.reduce((acc, curr) => acc + curr.cantidad, 0) : 0;
    const totalRevenue = products ? products.reduce((acc, curr) => {
        const subVal = typeof curr.subtotal === 'string'
            ? parseFloat(curr.subtotal.replace(/[^\d.-]/g, ''))
            : Number(curr.subtotal);
        return acc + (isNaN(subVal) ? 0 : subVal);
    }, 0) : 0;

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
                                {groupedProducts.length > 0 ? (
                                    <Accordion selectionMode="multiple" variant="splitted">
                                        {groupedProducts.map((group, idx) => (
                                            <AccordionItem
                                                key={`${group.nombre}-${idx}`}
                                                aria-label={group.nombre}
                                                startContent={
                                                    <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                                                        <FaBoxOpen />
                                                    </div>
                                                }
                                                subtitle={
                                                    <span className="text-xs text-default-400">
                                                        {group.nom_marca} • {group.variants.length} variante{group.variants.length !== 1 ? 's' : ''}
                                                    </span>
                                                }
                                                title={
                                                    <div className="flex justify-between items-center w-full pr-4">
                                                        <span className="font-semibold text-default-700 text-sm">{group.nombre}</span>
                                                        <div className="flex items-center gap-3">
                                                            <Chip size="sm" color="primary" variant="flat">{group.totalQty} und.</Chip>
                                                            <span className="text-sm font-bold text-success-600">S/ {group.totalRevenue.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                }
                                            >
                                                <div className="flex flex-col gap-2 pb-2">
                                                    {group.variants.map((variant, vIdx) => (
                                                        <div key={vIdx} className="flex justify-between items-center p-2 bg-default-50 rounded-lg border border-default-100">
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <FaTag className="text-default-400 text-xs" />
                                                                    <span className="text-xs font-semibold text-default-600">
                                                                        {variant.sku_label || 'Sin SKU'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {variant.attributes && typeof variant.attributes === 'object' && Object.entries(variant.attributes).map(([key, val], k) => (
                                                                        <span key={k} className="text-[10px] bg-white border border-default-200 px-1 rounded text-default-500">
                                                                            {key}: {val}
                                                                        </span>
                                                                    ))}
                                                                    {/* Fallback legacy attributes */}
                                                                    {!variant.attributes && variant.nombre_talla && (
                                                                        <span className="text-[10px] bg-white border border-default-200 px-1 rounded text-default-500">Talla: {variant.nombre_talla}</span>
                                                                    )}
                                                                    {!variant.attributes && variant.nombre_tonalidad && (
                                                                        <span className="text-[10px] bg-white border border-default-200 px-1 rounded text-default-500">Color: {variant.nombre_tonalidad}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-sm font-bold text-default-700">{variant.cantidad}</span>
                                                                <span className="text-[10px] text-default-400 ml-1">und</span>
                                                                <div className="text-xs font-medium text-success-600">
                                                                    {typeof variant.subtotal === 'string' ? variant.subtotal : `S/ ${variant.subtotal.toFixed(2)}`}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                ) : (
                                    <div className="text-center py-10 text-default-400">
                                        No hay productos registrados para este día.
                                    </div>
                                )}
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
