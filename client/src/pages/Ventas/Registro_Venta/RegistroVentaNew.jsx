import React from 'react';
import { Card, CardBody } from "@heroui/react";
import { usePOS } from './hooks/usePOS';
import ProductCatalog from './components/ProductCatalog';
import POSCart from './components/POSCart';
import { LayoutGrid } from 'lucide-react';

const RegistroVentaNew = () => {
    const pos = usePOS();

    return (
        <div className="h-[calc(100vh-6rem)] w-full bg-[#F3F4F6] dark:bg-zinc-950 p-2 md:p-4 gap-4 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2 px-1">
                <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-zinc-800">
                    <LayoutGrid className="text-blue-600 dark:text-blue-500" size={20} />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">Registro de Ventas</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Punto de Venta / Crear nueva venta</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
                {/* Left Column: Catalog (60-65% width on large screens) */}
                <div className="flex-1 min-w-0 flex flex-col h-full gap-4">
                    <ProductCatalog pos={pos} />
                </div>

                {/* Right Column: Cart (35-40% width) */}
                <div className="w-full md:w-[400px] lg:w-[480px] xl:w-[550px] flex-shrink-0 flex flex-col h-full">
                    <POSCart pos={pos} />
                </div>
            </div>
        </div>
    );
};

export default RegistroVentaNew;
