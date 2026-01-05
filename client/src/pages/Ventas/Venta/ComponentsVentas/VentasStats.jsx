import { useState, useCallback } from 'react';
import { Card, CardBody } from "@heroui/react";
import { FaShoppingBag, FaMoneyBillWave, FaCreditCard, FaCalculator } from "react-icons/fa";
import StatsFilters from './StatsFilters';
import useVentasStats from '@/services/data/data_venta_stats';

const VentasStats = () => {
    const [filters, setFilters] = useState({
        tipoComprobante: new Set([]),
        sucursal: '',
        estado: '',
        fecha_i: '',
        fecha_e: ''
    });

    const {
        totalRecaudado,
        totalEfectivo,
        totalElectronico,
        cantidadVentas
    } = useVentasStats(filters);

    const handleFilterChange = useCallback((newFilters) => {
        setFilters(newFilters);
    }, []);

    const cardClass = "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl";

    const KpiCard = ({ title, value, icon: Icon, colorClass }) => (
        <Card className={`${cardClass} border-none shadow-sm`}>
            <CardBody className="flex flex-row items-center gap-4 p-4">
                <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100`}>
                    <Icon className={`text-2xl ${colorClass.replace('bg-', 'text-').replace('/10', '')}`} />
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
                </div>
            </CardBody>
        </Card>
    );

    return (
        <div className="space-y-6 mt-4">
            {/* Filters */}
            <StatsFilters onFiltersChange={handleFilterChange} />

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="Total Ventas"
                    value={`S/. ${totalRecaudado ? totalRecaudado : "0.00"}`}
                    icon={FaShoppingBag}
                    colorClass="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                />
                <KpiCard
                    title="Total Efectivo"
                    value={`S/. ${totalEfectivo ? totalEfectivo : "0.00"}`}
                    icon={FaMoneyBillWave}
                    colorClass="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
                />
                <KpiCard
                    title="Total Electrónico"
                    value={`S/. ${totalElectronico ? totalElectronico : "0.00"}`}
                    icon={FaCreditCard}
                    colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                />
                <KpiCard
                    title="Cantidad Ventas"
                    value={cantidadVentas}
                    icon={FaCalculator}
                    colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                />
            </div>
        </div>
    );
};

export default VentasStats;
