import React, { useState, useEffect } from "react";
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import TablaLibro from './ComponentsLibroVentas/TablaLibro';
import ExportarExcel from './ComponentsLibroVentas/ExportarExcel';
import FiltroLibro from './ComponentsLibroVentas/FiltroLibro';
import useLibroVentasSunatData from './Data/getLibroVenta';

const LibroVentas = () => {
    const [filters, setFilters] = useState({
        startDate: null,
        endDate: null,
        tipoComprobante: null,
        idSucursal: null,
    });

    useEffect(() => {
        // Recuperar los filtros desde localStorage cuando el componente se monta
        const savedFilters = JSON.parse(localStorage.getItem("filters"));
        if (savedFilters) {
            setFilters(savedFilters);
        }
    }, []);
    

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
        refetch,
    } = useLibroVentasSunatData(filters); // Pasamos filters al hook

    // Método para manejar los filtros aplicados
    const handleFilter = (newFilters) => {
        setFilters(newFilters); // Actualizamos el estado de los filtros
        localStorage.setItem("filters", JSON.stringify(newFilters)); // Guardamos los filtros en localStorage
        refetch(1, limit, newFilters); // Recargamos los datos con los nuevos filtros
    };

    return (
        <div>
            <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Ventas', href: '/Ventas' }, { name: 'Reporte de ventas', href: '/ventas' }]} />
            <hr className="mb-4" />
            <div className="flex justify-between mt-5 mb-4">
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
                <FiltroLibro onFilter={handleFilter} filters={filters} />  {/* Pasamos los filtros como props */}
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
