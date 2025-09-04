import React, { useState } from "react";
import TablaLibro from './ComponentsLibroVentas/TablaLibro';
import ExportarExcel from './ComponentsLibroVentas/ExportarExcel';
import FiltroLibro from './ComponentsLibroVentas/FiltroLibro';
import useLibroVentasSunatData from '@/services/data/getLibroVenta';

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

    return (
        <div className="m-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                    <h1 className="font-extrabold text-4xl text-blue-900 tracking-tight mb-1">
                        Libro Registro de Ventas
                    </h1>
                    <p className="text-base text-blue-700/80 mb-2">
                        Registro oficial de ventas realizadas por la empresa, compatible con los requerimientos de SUNAT
                    </p>
                </div>
                <ExportarExcel />
            </div>
            <div className="bg-white/90 border border-blue-100 rounded-2xl shadow-sm p-4 mb-4">
                <FiltroLibro onFilter={handleFilter} filters={filters} />
            </div>
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

export default LibroVentas;