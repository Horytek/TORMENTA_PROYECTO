import { DateRangePicker, Select, SelectItem, Button } from "@nextui-org/react";
import { useState, useCallback } from "react";
import { format, isValid } from "date-fns";
import useSucursalData from '@/services/data/data_sucursal_venta';

const FiltroLibro = ({ onFilter, filters }) => {
    const { sucursales } = useSucursalData();
    const [dateRange, setDateRange] = useState(
        filters.startDate && filters.endDate
            ? {
                start: {
                    year: Number(filters.startDate.split('-')[0]),
                    month: Number(filters.startDate.split('-')[1]),
                    day: Number(filters.startDate.split('-')[2])
                },
                end: {
                    year: Number(filters.endDate.split('-')[0]),
                    month: Number(filters.endDate.split('-')[1]),
                    day: Number(filters.endDate.split('-')[2])
                }
            }
            : null
    );
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
        if (!dateObj?.year) return null;
        const jsDate = new Date(dateObj.year, dateObj.month - 1, dateObj.day);
        return isValid(jsDate) ? format(jsDate, "yyyy-MM-dd") : null;
    }, []);

    const applyFilters = useCallback((newDateRange, newTipoComprobante, newSucursal) => {
        const selectedComprobante = Array.from(newTipoComprobante);
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