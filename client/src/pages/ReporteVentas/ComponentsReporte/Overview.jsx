import React, { useState } from "react";
import { Card, Badge, Chip, Progress, Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, ScrollShadow } from "@heroui/react";
import { RiSearchLine } from "@remixicon/react";
import useCantidadVentasPorProducto from "@/services/reports/data_prod_venta";

const dataFormatter = (number) => ` ${Intl.NumberFormat("us").format(number).toString()}`;
const currencyFormatter = (number) => `S/ ${Intl.NumberFormat("us").format(number).toString()}`;

const BarChartHero = ({ idSucursal, year, month, week }) => {
    const { ventasPorProducto, loading, error } = useCantidadVentasPorProducto(idSucursal, year, month, week);
    const [sortType, setSortType] = useState("cantidad"); // "cantidad" | "ingresos"

    const barListData = ventasPorProducto.map((producto) => ({
        name: producto.descripcion,
        cantidad: producto.cantidad_vendida,
        ingresos: producto.dinero_generado,
    })).sort((a, b) => {
        if (sortType === "ingresos") {
            return b.ingresos - a.ingresos;
        }
        return b.cantidad - a.cantidad;
    });

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredItems = barListData.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calcular el máximo de productos vendidos para normalizar las barras
    const maxCantidad = Math.max(...barListData.map((item) => item.cantidad), 0);

    return (
        <>
            <Card className="p-6 rounded-2xl shadow-xl bg-white/90 dark:bg-zinc-900/80 border border-emerald-100/60 dark:border-emerald-900/40 backdrop-blur-[2px]">
                <div className="flex flex-col gap-4 mb-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                            Top Productos
                        </h3>
                        <Button
                            size="sm"
                            variant="light"
                            color="primary"
                            onClick={() => setIsOpen(true)}
                        >
                            Ver todos
                        </Button>
                    </div>

                    <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        <button
                            onClick={() => setSortType("cantidad")}
                            className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${sortType === "cantidad"
                                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                }`}
                        >
                            Por Cantidad
                        </button>
                        <button
                            onClick={() => setSortType("ingresos")}
                            className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${sortType === "ingresos"
                                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                }`}
                        >
                            Por Ingresos
                        </button>
                    </div>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                    {sortType === "cantidad"
                        ? "Productos más vendidos por volumen"
                        : "Productos que generan más ingresos"}
                </p>

                <div className="mt-4 min-h-[300px] max-h-[720px]">
                    {loading ? (
                        <p className="text-center py-4 text-sm">Cargando...</p>
                    ) : error ? (
                        <p className="text-center text-red-500 py-4 text-sm">Error: {error}</p>
                    ) : ventasPorProducto.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6">
                            <p className="text-gray-500 text-sm">No hay datos disponibles</p>
                        </div>
                    ) : (
                        <ScrollShadow hideScrollBar className="max-h-[720px] overflow-y-auto">
                            <div className="space-y-4">
                                {barListData.slice(0, 5).map((item) => (
                                    <div
                                        key={item.name}
                                        className="relative flex items-center w-full h-20 bg-gradient-to-r from-emerald-100/60 to-white/80 dark:from-emerald-900/30 dark:to-zinc-900/40 rounded-xl overflow-hidden border border-emerald-100/60 dark:border-emerald-900/40 shadow-sm"
                                    >
                                        <div className="relative z-10 flex justify-between items-center w-full px-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-100">
                                                    {item.name}
                                                </span>
                                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                    {dataFormatter(item.cantidad)} vendidos
                                                </span>
                                            </div>
                                            <Chip className="ml-2" color="success" size="sm" variant="solid">
                                                {currencyFormatter(item.ingresos)}
                                            </Chip>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollShadow>
                    )}
                </div>
            </Card>

            <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="2xl" className="z-[100]">
                <ModalContent>
                    <ModalHeader>
                        <div className="flex items-center justify-between w-full">
                            <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                Productos
                            </span>
                            <span className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">
                                Cantidad / Ingresos
                            </span>
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        <Input
                            startContent={<RiSearchLine />}
                            placeholder="Buscar producto..."
                            className="mt-2 rounded-md"
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                        />
                        <ScrollShadow hideScrollBar className="h-[calc(60vh)] w-full mt-4">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item) => (
                                    <div
                                        key={item.name}
                                        className="relative flex items-center w-full h-20 bg-gradient-to-r from-emerald-100/60 to-white/80 dark:from-emerald-900/30 dark:to-zinc-900/40 rounded-xl overflow-hidden border border-emerald-100/60 dark:border-emerald-900/40 shadow-sm mb-2"
                                    >
                                        <Progress
                                            value={(item.cantidad / maxCantidad) * 100}
                                            className="absolute top-0 left-0 w-full h-full opacity-20"
                                            color="success"
                                        />
                                        <div className="relative z-10 flex justify-between items-center w-full px-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-100">
                                                    {item.name}
                                                </span>
                                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                    {dataFormatter(item.cantidad)} vendidos
                                                </span>
                                            </div>
                                            <Chip
                                                className="ml-2"
                                                color="success"
                                                size="sm"
                                                variant="solid"
                                            >
                                                {currencyFormatter(item.ingresos)}
                                            </Chip>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="flex h-full items-center justify-center text-sm text-zinc-900 dark:text-zinc-100">
                                    No se encontraron resultados.
                                </p>
                            )}
                        </ScrollShadow>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            className="w-full"
                            color="primary"
                            variant="flat"
                            onClick={() => setIsOpen(false)}
                        >
                            Volver
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default BarChartHero;