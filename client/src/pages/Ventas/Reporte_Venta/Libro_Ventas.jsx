import React, { useState, useMemo } from "react";
import TablaLibro from './ComponentsLibroVentas/TablaLibro';
import ExportarExcel from './ComponentsLibroVentas/ExportarExcel';
import FiltroLibro from './ComponentsLibroVentas/FiltroLibro';
import useLibroVentasSunatData from '@/services/data/getLibroVenta';
import { Card, CardBody } from "@heroui/react";

const LibroVentas = () => {
    const [filters, setFilters] = useState({
        startDate: null,
        endDate: null,
        tipoComprobante: [],
        idSucursal: null,
    });

    const {
        ventas,
        totales,
        loading,
        error,
        metadata,
        page,
        limit,
        changePage,
        changeLimit,
    } = useLibroVentasSunatData(filters);

    // Método para manejar los filtros aplicados
    const handleFilter = (newFilters) => {
        setFilters(newFilters);
    };

    // Derivar presets para el exportador basado en filtros actuales
    // Nota: FiltroLibro maneja fechas exactas, pero el exportador usa Mes/Año.
    // Intentamos inferir el mes/año si startDate está presente.
    const exportPresets = useMemo(() => {
        const presets = {
            presetSucursal: filters.idSucursal,
            presetTipos: filters.tipoComprobante?.length ? filters.tipoComprobante : ['Boleta', 'Factura', 'Nota de venta'],
            autoSelect: true
        };

        if (filters.startDate) {
            const date = new Date(filters.startDate);
            presets.presetAno = date.getFullYear().toString();
            presets.presetMes = String(date.getMonth() + 1).padStart(2, '0');
        } else {
            // Default to current month/year if no filter
            const now = new Date();
            presets.presetAno = now.getFullYear().toString();
            presets.presetMes = String(now.getMonth() + 1).padStart(2, '0');
        }

        return presets;
    }, [filters]);

    return (
        <div className="max-w-[1600px] mx-auto p-4 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <h1 className="font-extrabold text-3xl text-blue-900 dark:text-blue-100 tracking-tight mb-1">
                        Libro Registro de Ventas
                    </h1>
                    <p className="text-sm text-blue-700/80 dark:text-blue-300/80 max-w-2xl">
                        Registro oficial de ventas y comprobantes electrónicos. Visualiza, filtra y exporta la información contable de acuerdo a los requerimientos de SUNAT.
                    </p>
                </div>
                <div className="flex-shrink-0">
                    <ExportarExcel {...exportPresets} />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                    title="Total General"
                    value={totales?.total_general}
                    color="blue"
                    loading={loading}
                />
                <SummaryCard
                    title="Base Imponible"
                    value={totales?.total_base}
                    color="slate"
                    loading={loading}
                />
                <SummaryCard
                    title="Total IGV"
                    value={totales?.total_igv}
                    color="slate"
                    loading={loading}
                />
                <SummaryCard
                    title="Registros"
                    value={metadata?.total_items || 0}
                    isCurrency={false}
                    color="slate"
                    loading={loading}
                />
            </div>

            {/* Filters */}
            <div className="bg-white/90 dark:bg-[#18192b] border border-blue-100 dark:border-zinc-700 rounded-2xl shadow-sm p-4">
                <FiltroLibro onFilter={handleFilter} filters={filters} />
            </div>

            {/* Table */}
            <TablaLibro
                ventas={ventas}
                totales={totales}
                loading={loading}
                error={error}
                metadata={metadata}
                page={page}
                limit={limit}
                changePage={changePage}
                changeLimit={changeLimit}
            />
        </div>
    );
};

// Componente auxiliar para tarjetas de resumen
const SummaryCard = ({ title, value, color = "blue", isCurrency = true, loading = false }) => {
    const formattedValue = loading
        ? "..."
        : isCurrency
            ? `S/ ${(value || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : value;

    const colorStyles = {
        blue: "bg-blue-50/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300",
        slate: "bg-slate-50/50 dark:bg-zinc-900/30 border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-slate-400",
        emerald: "bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300",
    };

    return (
        <Card className={`border shadow-sm ${colorStyles[color] || colorStyles.slate}`} shadow="none">
            <CardBody className="py-3 px-4">
                <p className="text-xs font-medium opacity-80 uppercase tracking-wider mb-1">{title}</p>
                <p className={`text-2xl font-bold ${color === 'blue' ? 'text-blue-900 dark:text-blue-100' : 'text-slate-900 dark:text-slate-100'}`}>
                    {formattedValue}
                </p>
            </CardBody>
        </Card>
    );
};

export default LibroVentas;