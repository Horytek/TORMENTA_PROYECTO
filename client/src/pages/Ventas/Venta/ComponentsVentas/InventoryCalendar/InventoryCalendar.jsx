import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardBody, Select, SelectItem, Button } from "@heroui/react";
import { format, getDaysInMonth, startOfMonth, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaFilePdf, FaCalendarAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import DayDetailDrawer from './DayDetailDrawer';
import { generateInventoryPDF } from './utils/InventoryPDF';

const InventoryCalendar = ({ ventas }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedDayData, setSelectedDayData] = useState(null);
    const [selectedDay, setSelectedDay] = useState(null);

    // Generate Year Options (Current - 5 to Current + 1)
    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);
    }, []);

    const months = [
        { value: 0, label: "Enero" }, { value: 1, label: "Febrero" }, { value: 2, label: "Marzo" },
        { value: 3, label: "Abril" }, { value: 4, label: "Mayo" }, { value: 5, label: "Junio" },
        { value: 6, label: "Julio" }, { value: 7, label: "Agosto" }, { value: 8, label: "Septiembre" },
        { value: 9, label: "Octubre" }, { value: 10, label: "Noviembre" }, { value: 11, label: "Diciembre" }
    ];

    // Process Data
    const calendarData = useMemo(() => {
        const data = {};
        if (!ventas) return data;

        ventas.forEach(venta => {
            // Filter by active status if needed, assuming 'Anulada' shouldn't count
            if (venta.estado === 'Anulada') return;

            const fecha = new Date(venta.fecha_iso || venta.fechaEmision); // Assuming standard ISO date or compatible string
            // Adjust simply for timezone if needed, but let's assume raw string matches local day or handle UTC correctly.
            // Usually "YYYY-MM-DD" string splits better to avoid timezone shifts.
            const dateParts = (venta.fecha_iso || venta.fechaEmision || "").split('T')[0].split('-');
            if (dateParts.length < 3) return;

            const year = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1; // 0-indexed
            const day = parseInt(dateParts[2]);

            if (year === selectedYear && month === selectedMonth) {
                if (!data[day]) {
                    data[day] = {
                        totalQuantity: 0,
                        totalRevenue: 0,
                        products: []
                    };
                }

                // Aggregate details
                venta.detalles.forEach(detalle => {
                    const qty = parseFloat(detalle.cantidad);
                    const sub = parseFloat(detalle.subtotal.replace('S/ ', '').replace('S/', '')) || 0;
                    data[day].totalQuantity += qty;
                    data[day].totalRevenue += sub;
                    data[day].products.push({
                        ...detalle,
                        cantidad: qty,
                        subtotal: detalle.subtotal // keep string format for display or parse?
                    });
                });
            }
        });

        // Post-process products to aggregate same items per day
        Object.keys(data).forEach(d => {
            const aggregated = {};
            data[d].products.forEach(p => {
                // Aggregating by key ensures products with identical names but different variants are grouped separately.
                // Create a unique key for the variant
                let variantKey = p.nombre;

                // Add variant details to key if they exist
                if (p.sku_label) variantKey += `-${p.sku_label}`;
                if (p.attributes) {
                    // If attributes is an object, stringify it safely
                    const attrStr = typeof p.attributes === 'object' ? JSON.stringify(p.attributes) : String(p.attributes);
                    variantKey += `-${attrStr}`;
                }
                // Fallback for legacy variant fields if no SKU/Attributes
                if (!p.sku_label && !p.attributes) {
                    if (p.nombre_tonalidad) variantKey += `-${p.nombre_tonalidad}`;
                    if (p.nombre_talla) variantKey += `-${p.nombre_talla}`;
                }

                const key = variantKey;
                if (!aggregated[key]) {
                    aggregated[key] = { ...p, cantidad: 0, subtotalValue: 0 };
                }
                aggregated[key].cantidad += p.cantidad;

                // Parse subtotal robustly
                const rawSubtotal = typeof p.subtotal === 'string'
                    ? parseFloat(p.subtotal.replace(/[^\d.-]/g, ''))
                    : Number(p.subtotal);

                aggregated[key].subtotalValue += (isNaN(rawSubtotal) ? 0 : rawSubtotal);
            });

            data[d].products = Object.values(aggregated).map(p => ({
                ...p,
                subtotal: `S/ ${p.subtotalValue.toFixed(2)}`
            }));
        });

        return data;
    }, [ventas, selectedMonth, selectedYear]);

    const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth));
    const firstDayOfMonth = getDay(startOfMonth(new Date(selectedYear, selectedMonth))); // 0 = Sunday

    const handleDayClick = (day) => {
        if (calendarData[day]) {
            setSelectedDay(day);
            setSelectedDayData(calendarData[day]);
            setDrawerOpen(true);
        }
    };

    const handleExport = () => {
        generateInventoryPDF(selectedMonth, selectedYear, calendarData);
    };

    const renderCells = () => {
        const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => <div key={`blank-${i}`} className="h-32 bg-transparent"></div>);
        const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const data = calendarData[day];
            const hasData = !!data;

            return (
                <div
                    key={`day-${day}`}
                    className={`h-32 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 flex flex-col justify-between transition-all relative overflow-hidden group
                ${hasData ? 'bg-white dark:bg-zinc-900 hover:shadow-md cursor-pointer hover:border-blue-400 dark:hover:border-blue-500' : 'bg-slate-50 dark:bg-zinc-900/50 opacity-60'}
            `}
                    onClick={() => handleDayClick(day)}
                >
                    <span className={`text-sm font-semibold flex justify-center items-center w-8 h-8 rounded-full ${hasData ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-slate-400'}`}>
                        {day}
                    </span>

                    {hasData ? (
                        <div className="flex flex-col items-center gap-1 mt-2">
                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-bold text-slate-800 dark:text-white">{data.totalQuantity}</span>
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Productos</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-lg py-1 px-2 flex justify-center mt-1">
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">S/ {data.totalRevenue.toFixed(2)}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex justify-center items-center">
                            <span className="text-slate-300 text-2xl">-</span>
                        </div>
                    )}
                </div>
            );
        });

        return [...blanks, ...dayCells];
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header Filters */}
            <Card className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl">
                <CardBody className="flex flex-col md:flex-row justify-between items-center gap-4 p-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-2">
                            <Button isIconOnly variant="flat" onPress={() => setSelectedMonth(prev => prev === 0 ? 11 : prev - 1)}>
                                <FaChevronLeft />
                            </Button>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white capitalize w-32 text-center">
                                {months[selectedMonth].label}
                            </h2>
                            <Button isIconOnly variant="flat" onPress={() => setSelectedMonth(prev => prev === 11 ? 0 : prev + 1)}>
                                <FaChevronRight />
                            </Button>
                        </div>

                        <Select
                            aria-label="Seleccionar Año"
                            selectedKeys={[String(selectedYear)]}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="w-32"
                            size="sm"
                        >
                            {years.map(year => (
                                <SelectItem key={year} value={year}>{String(year)}</SelectItem>
                            ))}
                        </Select>
                    </div>

                    <Button
                        color="danger"
                        variant="shadow"
                        startContent={<FaFilePdf />}
                        onPress={handleExport}
                        className="w-full md:w-auto font-semibold"
                    >
                        Exportar Reporte Mensual
                    </Button>
                </CardBody>
            </Card>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-4">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                    <div key={day} className="text-center font-bold text-slate-400 uppercase text-xs py-2">
                        {day}
                    </div>
                ))}
                {renderCells()}
            </div>

            <DayDetailDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                day={selectedDay}
                products={selectedDayData?.products}
            />
        </div>
    );
};

export default InventoryCalendar;
