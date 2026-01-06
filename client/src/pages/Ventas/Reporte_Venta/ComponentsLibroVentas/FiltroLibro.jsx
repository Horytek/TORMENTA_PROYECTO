import { DateRangePicker, Select, SelectItem, Button } from "@heroui/react";
import { useState, useCallback } from "react";
import { format, isValid } from "date-fns";
import { useSucursalData } from "@/services/ventas.services";

const FiltroLibro = ({ onFilter, filters }) => {
    const { sucursales } = useSucursalData();

    // Inicialización segura del rango de fechas
    const [dateRange, setDateRange] = useState(() => {
        if (filters.startDate && filters.endDate) {
            try {
                const startParts = filters.startDate.split('-');
                const endParts = filters.endDate.split('-');
                if (startParts.length === 3 && endParts.length === 3) {
                    return {
                        start: {
                            year: Number(startParts[0]),
                            month: Number(startParts[1]),
                            day: Number(startParts[2])
                        },
                        end: {
                            year: Number(endParts[0]),
                            month: Number(endParts[1]),
                            day: Number(endParts[2])
                        }
                    };
                }
            } catch (e) {
                console.error("Error parsing dates in FiltroLibro:", e);
            }
        }
        return null;
    });

    const [tipoComprobante, setTipoComprobante] = useState(
        new Set(Array.isArray(filters.tipoComprobante) ? filters.tipoComprobante : [])
    );
    const [sucursal1, setSucursal] = useState(
        new Set(filters.idSucursal ? [filters.idSucursal] : [])
    );

    const comprobantes = [
        { label: "Boleta", value: "Boleta" },
        { label: "Factura", value: "Factura" },
        { label: "Nota de venta", value: "Nota de venta" },
    ];

    const formatDateSafely = useCallback((dateObj) => {
        if (!dateObj?.year || !dateObj?.month || !dateObj?.day) return null;
        try {
            const jsDate = new Date(dateObj.year, dateObj.month - 1, dateObj.day);
            return isValid(jsDate) ? format(jsDate, "yyyy-MM-dd") : null;
        } catch (e) {
            console.error("Error formatting date:", e);
            return null;
        }
    }, []);

    const applyFilters = useCallback((newDateRange, newTipoComprobante, newSucursal) => {
        const selectedComprobante = Array.from(newTipoComprobante || []);
        // Siempre string o vacío
        const selectedSucursal = Array.from(newSucursal || [])[0];
        let idSucursal = selectedSucursal !== undefined && selectedSucursal !== null ? String(selectedSucursal) : "";
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
            idSucursal: idSucursal
        });
    }, [onFilter, formatDateSafely]);

    const handleDateChange = (value) => {
        setDateRange(value);
        applyFilters(value, tipoComprobante, sucursal1);
    };

    const handleComprobanteChange = (selected) => {
        setTipoComprobante(new Set(selected));
        applyFilters(dateRange, new Set(selected), sucursal1);
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
                selectedKeys={sucursal1}
                onSelectionChange={handleSucursalChange}
            >
                {(sucursales || []).map((suc) => (
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
                selectionMode="multiple"
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