import React, { useState, useMemo } from "react";
import TablaLibro from './ComponentsLibroVentas/TablaLibro';
import ExportarExcel from './ComponentsLibroVentas/ExportarExcel';
import FiltroLibro from './ComponentsLibroVentas/FiltroLibro';
import useLibroVentasSunatData from '@/services/data/getLibroVenta';
import { Card, CardBody } from "@heroui/react";
import { FaCalculator, FaMoneyBillWave, FaFileInvoice, FaPercent } from "react-icons/fa";

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

    // Auxiliar imports for Icons


    // KPI Card Component
    const cardClass = "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl";
    const KpiCard = ({ title, value, icon: Icon, colorClass, isCurrency = true }) => {
        const formattedValue = isCurrency
            ? `S/ ${(value || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : value;

        return (
            <Card className={`${cardClass} border-none shadow-sm`}>
                <CardBody className="flex flex-row items-center gap-4 p-4">
                    <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100`}>
                        <Icon className={`text-2xl ${colorClass.replace('bg-', 'text-').replace('/10', '')}`} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{formattedValue}</p>
                    </div>
                </CardBody>
            </Card>
        );
    };

    // ... inside component ...

    return (
        <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#09090b] p-6 md:p-8 font-inter">
            <div className="max-w-[1920px] mx-auto space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <h1 className="font-extrabold text-3xl text-[#1e293b] dark:text-white tracking-tight mb-1">
                            Libro Registro de Ventas
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1 max-w-2xl">
                            Registro oficial de ventas y comprobantes electrónicos. Visualiza, filtra y exporta la información contable.
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <ExportarExcel {...exportPresets} />
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        title="Total General"
                        value={totales?.total_general}
                        icon={FaCalculator}
                        colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    />
                    <KpiCard
                        title="Base Imponible"
                        value={totales?.total_base}
                        icon={FaMoneyBillWave}
                        colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                    />
                    <KpiCard
                        title="Total IGV"
                        value={totales?.total_igv}
                        icon={FaPercent}
                        colorClass="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                    />
                    <KpiCard
                        title="Registros"
                        value={metadata?.total_items || 0}
                        icon={FaFileInvoice}
                        colorClass="bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400"
                        isCurrency={false}
                    />
                </div>

                {/* Filters */}
                <div className="space-y-4">
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
        </div>
    );

};

export default LibroVentas;