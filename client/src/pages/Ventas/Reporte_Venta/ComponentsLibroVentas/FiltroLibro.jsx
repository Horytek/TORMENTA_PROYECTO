import { DateRangePicker, Select, SelectItem, Button } from "@nextui-org/react";
import { useState, useCallback, useEffect } from "react";
import { format, isValid } from "date-fns";

const FiltroLibro = ({ onFilter, filters }) => {
    const [dateRange, setDateRange] = useState(filters.startDate ? { start: filters.startDate, end: filters.endDate } : null);
    const [tipoComprobante, setTipoComprobante] = useState(new Set(filters.tipoComprobante ? [filters.tipoComprobante] : []));
    const [sucursal, setSucursal] = useState(new Set(filters.idSucursal ? [filters.idSucursal] : []));

    useEffect(() => {
        // Al cambiar los filtros, los almacenamos en localStorage
        localStorage.setItem("filters", JSON.stringify({ startDate: filters.startDate, endDate: filters.endDate, tipoComprobante: filters.tipoComprobante, idSucursal: filters.idSucursal }));
    }, [filters]);

    const sucursales = [
        { id: 1, nombre: "Tienda Arica-3" },
        { id: 2, nombre: "Tienda Arica-2" },
        { id: 3, nombre: "Tienda Arica-1" },
        { id: 4, nombre: "Tienda Balta" },
        { id: 5, nombre: "Oficina" }
    ];

    const comprobantes = [
        { label: "Boleta", value: "boleta" },
        { label: "Factura", value: "factura" },
    ];

    const formatDateSafely = useCallback((dateObj) => {
        if (!dateObj?.year) return null;
        const jsDate = new Date(dateObj.year, dateObj.month - 1, dateObj.day);
        return isValid(jsDate) ? format(jsDate, "yyyy-MM-dd") : null;
    }, []);

    const applyFilters = useCallback((newDateRange, newTipoComprobante, newSucursal) => {
        const selectedComprobante = Array.from(newTipoComprobante)[0] || null;
        const selectedSucursal = Array.from(newSucursal)[0] || null;
        let startDate = null;
        let endDate = null;

        if (newDateRange?.start && newDateRange?.end) {
            startDate = formatDateSafely(newDateRange.start);
            endDate = formatDateSafely(newDateRange.end);
        }

        onFilter({
            startDate,
            endDate,
            tipoComprobante: selectedComprobante,
            idSucursal: selectedSucursal
        });
    }, []);

    const handleDateChange = (value) => {
        setDateRange(value);
        applyFilters(value, tipoComprobante, sucursal);
    };

    const handleComprobanteChange = (selected) => {
        setTipoComprobante(selected);
        applyFilters(dateRange, selected, sucursal);
    };

    const handleSucursalChange = (selected) => {
        setSucursal(selected);
        applyFilters(dateRange, tipoComprobante, selected);
    };

    const handleReset = () => {
        setDateRange(null);
        setTipoComprobante(new Set([]));
        setSucursal(new Set([]));
        applyFilters(null, new Set([]), new Set([]));
    };

    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <Select
                label="Sucursal"
                placeholder="Seleccione sucursal"
                className="w-[200px]"
                selectedKeys={sucursal}
                onSelectionChange={handleSucursalChange}
            >
                {sucursales.map((suc) => (
                    <SelectItem key={suc.id} value={suc.id}>
                        {suc.nombre}
                    </SelectItem>
                ))}
            </Select>
            <DateRangePicker
                label="Filtrar por fecha"
                value={dateRange}
                onChange={handleDateChange}
                placeholder="Seleccione rango de fechas"
                className="w-[250px]"
                formatOptions={{
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                }}
            />
            <Select
                label="Tipo de comprobante"
                placeholder="Seleccione tipo"
                className="w-[200px]"
                selectedKeys={tipoComprobante}
                onSelectionChange={handleComprobanteChange}
            >
                {comprobantes.map((comprobante) => (
                    <SelectItem key={comprobante.value} value={comprobante.value}>
                        {comprobante.label}
                    </SelectItem>
                ))}
            </Select>

            <div className="flex gap-2">
                <Button
                    variant="bordered"
                    onClick={handleReset}
                    className="min-w-[100px]"
                >
                    Reiniciar
                </Button>
            </div>
        </div>
    );
};

export default FiltroLibro;
