import React, { useState } from "react";
import TablaLibro from './ComponentsLibroVentas/TablaLibro';
import ExportarExcel from './ComponentsLibroVentas/ExportarExcel';
import FiltroLibro from './ComponentsLibroVentas/FiltroLibro';
import useLibroVentasSunatData from '@/services/Data/getLibroVenta';

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
        <div>
            <div className="flex justify-between mt-2 mb-2">
                <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
                    Libro Registro de Ventas
                </h1>
            </div>

            <div className="flex justify-between items-center" style={{ marginBottom: "20px" }}>
                <p
                    className="text-small text-default-400"
                    style={{
                        fontSize: "16px",
                        pointerEvents: "none",
                        userSelect: "none",
                        marginTop: "10px",
                    }}
                >
                    Registro oficial de ventas realizadas por la empresa, compatible con los requerimientos de SUNAT
                </p>

                <ExportarExcel />
            </div>
            <div className="border-t border-default-200 mb-4" style={{ marginTop: "20px" }}>
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