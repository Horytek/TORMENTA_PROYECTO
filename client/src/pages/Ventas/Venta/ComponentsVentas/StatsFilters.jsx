import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { DateRangePicker } from "@heroui/date-picker";
import useComprobanteData from "@/services/data/data_comprobante_venta";
import useSucursalData from "@/services/data/data_sucursal_venta";
import { parseDate } from "@internationalized/date";
import { Select, SelectItem } from "@heroui/react";
import { useUserStore } from "@/store/useStore";

const StatsFilters = ({ onFiltersChange }) => {
    const { comprobantes } = useComprobanteData();
    const { sucursales } = useSucursalData();
    const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState(new Set([]));
    const [sucursalSeleccionado, setSucursalSeleccionado] = useState("");
    const [value, setValue] = React.useState({
        start: parseDate("2024-04-01"),
        end: parseDate("2028-04-08"),
    });
    const [tempValue, setTempValue] = useState(value);
    const [estado, setEstado] = useState("");

    const rol = useUserStore((state) => state.rol);
    const sur = useUserStore((state) => state.sur);

    const handleDateChange = (newValue) => {
        if (newValue.start && newValue.end) {
            setValue(newValue);
            setTempValue(newValue);
        } else {
            setTempValue(newValue);
        }
    };

    useEffect(() => {
        let fecha_i = "";
        let fecha_e = "";

        if (value.start && value.end) {
            const date_i = new Date(
                value.start.year,
                value.start.month - 1,
                value.start.day
            );
            fecha_i = `${date_i.getFullYear()}-${String(
                date_i.getMonth() + 1
            ).padStart(2, "0")}-${String(date_i.getDate()).padStart(2, "0")}`;

            const date_e = new Date(value.end.year, value.end.month - 1, value.end.day);
            fecha_e = `${date_e.getFullYear()}-${String(
                date_e.getMonth() + 1
            ).padStart(2, "0")}-${String(date_e.getDate()).padStart(2, "0")}`;
        }

        const filtros = {
            tipoComprobante: comprobanteSeleccionado,
            sucursal: sucursalSeleccionado,
            fecha_i,
            fecha_e,
            estado,
        };

        onFiltersChange(filtros);
    }, [
        comprobanteSeleccionado,
        sucursalSeleccionado,
        value,
        estado,
        onFiltersChange,
    ]);

    // Set default sucursal based on user role
    useEffect(() => {
        if (rol !== 1 && sur) {
            setSucursalSeleccionado(sur);
        }
    }, [rol, sur]);

    return (
        <div className="w-full">
            <div
                className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-4
            gap-3
        "
            >
                {/* Tipo comprobante */}
                <div className="col-span-1">
                    <Select
                        label="Tipo Comprobante"
                        placeholder="Seleccione tipos"
                        selectionMode="multiple"
                        selectedKeys={comprobanteSeleccionado}
                        onSelectionChange={setComprobanteSeleccionado}
                        size="sm"
                        variant="bordered"
                        className="w-full"
                        classNames={{
                            trigger: "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 h-14",
                            popoverContent: "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700"
                        }}
                    >
                        {comprobantes.map((comprobante) => (
                            <SelectItem key={comprobante.nombre} value={comprobante.nombre}>
                                {comprobante.nombre}
                            </SelectItem>
                        ))}
                    </Select>
                </div>

                {/* Sucursal */}
                <div className="col-span-1">
                    <Select
                        label="Sucursal"
                        placeholder="Seleccione sucursal"
                        selectedKeys={sucursalSeleccionado ? [sucursalSeleccionado] : []}
                        onChange={(e) => setSucursalSeleccionado(e.target.value)}
                        isDisabled={rol !== 1}
                        size="sm"
                        variant="bordered"
                        className="w-full"
                        classNames={{
                            trigger: "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 h-14",
                            popoverContent: "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700"
                        }}
                    >
                        {sucursales.map((sucursal) => (
                            <SelectItem key={sucursal.nombre} value={sucursal.nombre}>
                                {sucursal.nombre}
                            </SelectItem>
                        ))}
                    </Select>
                </div>

                {/* Estado */}
                <div className="col-span-1">
                    <Select
                        label="Estado"
                        placeholder="Seleccione estado"
                        selectedKeys={estado ? [estado] : []}
                        onChange={(e) => setEstado(e.target.value)}
                        size="sm"
                        variant="bordered"
                        className="w-full"
                        classNames={{
                            trigger: "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 h-14",
                            popoverContent: "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700"
                        }}
                    >
                        <SelectItem key="" value="">Todos</SelectItem>
                        <SelectItem key="Aceptada" value="Aceptada">Aceptada</SelectItem>
                        <SelectItem key="En proceso" value="En proceso">En proceso</SelectItem>
                        <SelectItem key="Anulada" value="Anulada">Anulada</SelectItem>
                    </Select>
                </div>

                {/* Rango de fechas */}
                <div className="col-span-1">
                    <DateRangePicker
                        label="Fecha"
                        className="w-full"
                        variant="bordered"
                        classNames={{
                            base: "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 h-14",
                            inputWrapper: "border-slate-200 dark:border-zinc-700 hover:border-blue-400 group-data-[focus=true]:border-blue-600",
                            calendar: "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700",
                            segment: "text-slate-700 dark:text-slate-200"
                        }}
                        value={tempValue}
                        onChange={handleDateChange}
                        size="sm"
                    />
                </div>
            </div>
        </div>
    );
};

StatsFilters.propTypes = {
    onFiltersChange: PropTypes.func.isRequired,
};

export default StatsFilters;
