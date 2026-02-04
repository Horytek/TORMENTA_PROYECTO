import React, { useState } from "react";
import { Card, Chip, Spinner, Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, ScrollShadow } from "@heroui/react";
import { RiSearchLine } from "@remixicon/react";
import { useCantidadVentasPorProducto, useTopProductosMargen } from "@/services/reportes.services";

const dataFormatter = (number) => ` ${Intl.NumberFormat("us").format(number).toString()}`;
const currencyFormatter = (number) => `S/ ${Intl.NumberFormat("us").format(number).toString()}`;

const BarChartHero = ({ idSucursal, year, month, week }) => {
    // Hook Ventas (Cantidad / Ingresos)
    const { ventasPorProducto, loading: loadingSales, error: errorSales } = useCantidadVentasPorProducto(idSucursal, year, month, week);

    // Hook Margen
    const { data: marginData, loading: loadingMargin, error: errorMargin } = useTopProductosMargen(idSucursal, year, month, week, 5);

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Default to 'cantidad' logic without state
    const isLoading = loadingSales;
    const error = errorSales;
    const sortType = "cantidad"; // Fixed to quantity

    const displayData = ventasPorProducto.map((producto) => ({
        name: producto.nombre || producto.descripcion,
        cantidad: Number(producto.cantidad_vendida),
        ingresos: Number(producto.dinero_generado),
        isMargin: false
    })).sort((a, b) => b.cantidad - a.cantidad)
        .map(item => ({
            ...item,
            metricLabel: `Ingresos: ${currencyFormatter(item.ingresos)}`,
            value: item.cantidad,
            chipValue: `${dataFormatter(item.cantidad)} un.`
        }));

    // Filter for Modal
    const filteredItems = displayData.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Colors for ranking
    const dotColors = ["bg-indigo-500", "bg-blue-500", "bg-sky-500", "bg-cyan-500", "bg-teal-500"];

    return (
        <>
            <Card className="w-full h-auto p-6 rounded-3xl shadow-sm bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                Top Desempeño
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Productos más vendidos por volumen
                            </p>
                        </div>
                        <Button
                            size="sm"
                            variant="light"
                            className="text-indigo-600 font-medium"
                            onPress={() => setIsOpen(true)}
                        >
                            Ver todos
                        </Button>
                    </div>
                </div>

                <div className="flex-1">
                    {isLoading ? (
                        <div className="flex justify-center py-10"><Spinner size="lg" color="primary" /></div>
                    ) : error ? (
                        <p className="text-center text-rose-500 py-4 text-sm">Error: {error}</p>
                    ) : displayData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                            <p className="text-sm">No hay datos disponibles</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {displayData.slice(0, 5).map((item, index) => (
                                <div
                                    key={`${item.name}-${index}`}
                                    className="relative flex items-center justify-between w-full p-4 bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-slate-100 dark:border-zinc-800/50 hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-colors group"
                                >
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        {sortType === "margen" ? (
                                            <div className={`flex-shrink-0 w-2 h-2 rounded-full ${dotColors[index % dotColors.length]}`}></div>
                                        ) : (
                                            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${index < 3 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-slate-400'}`}>
                                                {index + 1}
                                            </div>
                                        )}

                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-sm font-bold truncate text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {item.name}
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {item.isMargin ? item.metricLabel : `${dataFormatter(item.cantidad)} vendidos`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <Chip
                                            className={`border font-bold shadow-sm ${item.isMargin ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-white text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-slate-200 dark:border-zinc-700"}`}
                                            size="sm"
                                            variant="flat"
                                        >
                                            {item.isMargin ? `${item.value}%` : currencyFormatter(item.ingresos)}
                                        </Chip>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Modal solo para Cantidad/Ingresos */}
            <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="2xl" className="z-[100]">
                <ModalContent>
                    <ModalHeader>
                        <div className="flex items-center justify-between w-full">
                            <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                Todos los Productos
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
                                        className="relative flex items-center w-full h-16 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 rounded-2xl border border-slate-100 dark:border-zinc-700/50 transition-colors mb-2 px-4"
                                    >
                                        <div className="relative z-10 flex justify-between items-center w-full">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium truncate text-zinc-900 dark:text-zinc-100">
                                                    {item.name}
                                                </span>
                                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                                    {dataFormatter(item.cantidad)} vendidos
                                                </span>
                                            </div>
                                            <Chip
                                                className="ml-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                                                size="sm"
                                                variant="flat"
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