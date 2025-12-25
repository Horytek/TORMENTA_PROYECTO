import { useState, useEffect, useCallback } from "react";
import { getSucursalesGuia } from '@/services/guiaRemision.services';
import { DateRangePicker, Select, SelectItem, Input, Button, Tooltip } from '@heroui/react';
import { parseDate } from "@internationalized/date";
import { RefreshCw, Filter, Calendar as CalendarIcon, Store, FileText, Search, Truck } from "lucide-react";

// Estilos Soft Modern Glass (Golden Standard)
const glassInputClasses = {
    inputWrapper: "h-11 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-white/10 shadow-none hover:bg-white dark:hover:bg-zinc-800 transition-all rounded-xl",
    input: "text-sm text-slate-700 dark:text-slate-200 font-medium placeholder:text-slate-400",
};

const glassSelectClasses = {
    trigger: "h-11 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-white/10 shadow-none hover:bg-white dark:hover:bg-zinc-800 transition-all rounded-xl",
    value: "text-sm text-slate-700 dark:text-slate-200 font-medium",
    popoverContent: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 shadow-xl rounded-xl min-w-[240px]",
};

const FiltrosGuias = ({ onFiltersChange, onRefresh }) => {
    const [sucursales, setSucursales] = useState([]);
    const [value, setValue] = useState({
        start: parseDate("2024-01-01"),
        end: parseDate("2028-12-31"),
    });
    // Default to 'Todos' internally represented as empty string for API if needed, or check backend handling
    const [sucursalSeleccionado, setSucursalSeleccionado] = useState('');
    const [numGuia, setNumGuia] = useState('');
    const [documento, setDocumento] = useState('');

    // Cargar sucursales
    useEffect(() => {
        const fetchSucursales = async () => {
            const result = await getSucursalesGuia();
            if (result.success) setSucursales(result.data);
        };
        fetchSucursales();
    }, []);

    const handleFiltersChange = useCallback(() => {
        const date_i = `${value.start.year}-${String(value.start.month).padStart(2, '0')}-${String(value.start.day).padStart(2, '0')}`;
        const date_e = `${value.end.year}-${String(value.end.month).padStart(2, '0')}-${String(value.end.day).padStart(2, '0')}`;

        const filtrosG = {
            sucursalSeleccionado,
            fecha_i: date_i,
            fecha_e: date_e,
            numGuia,
            documento,
        };

        onFiltersChange(filtrosG);
    }, [sucursalSeleccionado, value, numGuia, documento, onFiltersChange]);

    useEffect(() => {
        const t = setTimeout(() => {
            handleFiltersChange();
        }, 500); // 500ms debounce
        return () => clearTimeout(t);
    }, [handleFiltersChange]);

    const handleReset = () => {
        setSucursalSeleccionado('');
        setNumGuia('');
        setDocumento('');
        setValue({
            start: parseDate("2024-01-01"),
            end: parseDate("2028-12-31"),
        });
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                {/* Filters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full xl:flex-1">
                    <Select
                        placeholder="Seleccionar Sucursal"
                        selectedKeys={sucursalSeleccionado ? [sucursalSeleccionado] : []}
                        onChange={(e) => setSucursalSeleccionado(e.target.value)}
                        startContent={<Store className="w-4 h-4 text-slate-400" />}
                        classNames={glassSelectClasses}
                        aria-label="Sucursal"
                        size="sm"
                    >
                        {sucursales.map((sucursal) => (
                            <SelectItem key={sucursal.nombre} value={sucursal.nombre}>
                                {sucursal.nombre}
                            </SelectItem>
                        ))}
                    </Select>

                    <Input
                        placeholder="Número de guía"
                        value={numGuia}
                        onChange={(e) => setNumGuia(e.target.value)}
                        startContent={<Truck className="w-4 h-4 text-slate-400" />}
                        classNames={glassInputClasses}
                        isClearable
                        onClear={() => setNumGuia('')}
                        size="sm"
                    />

                    <Input
                        placeholder="Documento o RUC"
                        value={documento}
                        onChange={(e) => setDocumento(e.target.value)}
                        startContent={<FileText className="w-4 h-4 text-slate-400" />}
                        classNames={glassInputClasses}
                        isClearable
                        onClear={() => setDocumento('')}
                        size="sm"
                    />

                    <DateRangePicker
                        value={value}
                        onChange={setValue}
                        className="w-full"
                        classNames={{
                            inputWrapper: glassInputClasses.inputWrapper,
                            segment: "text-slate-700 dark:text-slate-200 uppercase text-xs font-semibold tracking-wider",
                        }}
                        startContent={<CalendarIcon className="w-4 h-4 text-slate-400" />}
                        size="sm"
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-full xl:w-auto justify-end mt-2 xl:mt-0">
                    <Tooltip content="Recargar datos">
                        <Button
                            isIconOnly
                            variant="flat"
                            onPress={onRefresh}
                            className="w-11 h-11 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 rounded-xl"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </Tooltip>

                    <Tooltip content="Limpiar filtros">
                        <Button
                            isIconOnly
                            variant="flat"
                            onPress={handleReset}
                            className="w-11 h-11 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 rounded-xl hover:text-red-500"
                        >
                            <Filter className="w-4 h-4" />
                        </Button>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
};

export default FiltrosGuias;