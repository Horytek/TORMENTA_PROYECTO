import { useState, useEffect, useCallback, useMemo } from 'react';
import { DateRangePicker, Select, SelectItem, Input, Button, Tooltip } from '@heroui/react';
import { parseDate } from "@internationalized/date";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaSearch } from "react-icons/fa";
import { RefreshCw, Filter, Calendar as CalendarIcon, Store, FileText } from "lucide-react";
import { usePermisos } from '@/routes';
import { useUserStore } from "@/store/useStore";

// Estilos Soft Modern Glass
const glassInputClasses = {
  inputWrapper: "h-11 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-white/10 shadow-none hover:bg-white dark:hover:bg-zinc-800 transition-all rounded-xl",
  input: "text-sm text-slate-700 dark:text-slate-200 font-medium placeholder:text-slate-400",
};

const glassSelectClasses = {
  trigger: "h-11 bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-white/10 shadow-none hover:bg-white dark:hover:bg-zinc-800 transition-all rounded-xl",
  value: "text-sm text-slate-700 dark:text-slate-200 font-medium",
  popoverContent: "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 shadow-xl rounded-xl min-w-[240px]",
};

const FiltrosIngresos = ({ almacenes = [], onAlmacenChange, onFiltersChange, onRefresh, ingresos, almacenSseleccionado, tipo = 'ingreso' }) => {
  const navigate = useNavigate();
  const { hasCreatePermission } = usePermisos();
  const rolUsuario = useUserStore((state) => state.rol);
  const sucursalSeleccionada = useUserStore((state) => state.sur);
  const almacenGlobal = useUserStore((state) => state.almacen);
  const setAlmacenGlobal = useUserStore((state) => state.setAlmacen);

  const isAdmin = String(rolUsuario) === "1";

  // Initial Almacen
  const initialAlmacen = useMemo(() => {
    if (almacenGlobal && almacenes.length > 0) {
      return almacenes.find(a => a.id === parseInt(almacenGlobal)) || { id: '%', sucursal: '' };
    }
    return { id: '%', sucursal: '' };
  }, [almacenes, almacenGlobal]);

  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(initialAlmacen);

  useEffect(() => {
    if (almacenGlobal && almacenes.length > 0) {
      const match = almacenes.find(a => a.id === parseInt(almacenGlobal));
      if (match) setAlmacenSeleccionado(match);
    }
  }, [almacenGlobal, almacenes]);

  const [estado, setEstado] = useState('%');
  const [value, setValue] = useState({
    start: parseDate("2024-01-01"),
    end: parseDate("2028-12-31"),
  });

  const [searchRazon, setSearchRazon] = useState('');
  const [searchDocumento, setSearchDocumento] = useState('');
  const [razon, setRazon] = useState('');
  const [documento, setDocumento] = useState('');

  // Debounce inputs
  useEffect(() => {
    const t = setTimeout(() => {
      setRazon(searchRazon.trim());
      setDocumento(searchDocumento.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [searchRazon, searchDocumento]);

  const almacenesFiltrados = useMemo(() => {
    return String(rolUsuario) !== "1"
      ? almacenes.filter(a => a.sucursal === sucursalSeleccionada)
      : almacenes;
  }, [almacenes, rolUsuario, sucursalSeleccionada]);

  // Apply filters automatically
  const applyFilters = useCallback(() => {
    const date_i = `${value.start.year}-${String(value.start.month).padStart(2, '0')}-${String(value.start.day).padStart(2, '0')}`;
    const date_e = `${value.end.year}-${String(value.end.month).padStart(2, '0')}-${String(value.end.day).padStart(2, '0')}`;

    const filtros = {
      fecha_i: date_i,
      fecha_e: date_e,
      razon_social: razon || undefined,
      almacen: almacenSeleccionado?.id !== '%' ? almacenSeleccionado?.id : undefined,
      documento: documento || undefined,
      estado: estado !== '%' ? estado : undefined,
    };

    onFiltersChange(filtros);
  }, [value, razon, documento, almacenSeleccionado, estado, onFiltersChange]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  const handleAlmacenChange = (event) => {
    const val = event.target.value;
    const almacen = val === '%' ? { id: '%', sucursal: '' } : almacenes.find((a) => a.id === parseInt(val));
    setAlmacenSeleccionado(almacen);
    setAlmacenGlobal(almacen.id === '%' ? '' : almacen.id);
    onAlmacenChange(almacen);
  };

  const handleReset = () => {
    setAlmacenSeleccionado({ id: '%', sucursal: '' });
    setAlmacenGlobal('');
    setEstado('%');
    setSearchRazon('');
    setSearchDocumento('');
    setValue({ start: parseDate("2024-01-01"), end: parseDate("2028-12-31") });
    onAlmacenChange({ id: '%', sucursal: '' });
  };

  const handleNavigation = () => {
    if (tipo === 'ingreso') {
      navigate("/almacen/nota_ingreso/registro_ingreso");
    } else {
      navigate("/almacen/nota_salida/nueva_nota_salida");
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full xl:flex-1">

          <Select
            placeholder="Seleccionar Almacén"
            selectedKeys={[almacenSeleccionado?.id?.toString() || '%']}
            onChange={handleAlmacenChange}
            startContent={<Store className="w-4 h-4 text-slate-400" />}
            classNames={glassSelectClasses}
            aria-label="Almacén"
            size="sm"
          >
            {isAdmin && <SelectItem key="%" value="%">Todos los almacenes</SelectItem>}
            {almacenesFiltrados.map((almacen) => (
              <SelectItem key={almacen.id} value={almacen.id} textValue={almacen.almacen}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{almacen.almacen}</span>
                  <span className="text-[10px] text-slate-400">{almacen.sucursal}</span>
                </div>
              </SelectItem>
            ))}
          </Select>

          <Input
            placeholder="Razón Social"
            value={searchRazon}
            onChange={(e) => setSearchRazon(e.target.value)}
            startContent={<FaSearch className="w-3.5 h-3.5 text-slate-400" />}
            classNames={glassInputClasses}
            isClearable
            onClear={() => setSearchRazon('')}
            size="sm"
          />

          <Input
            placeholder="Documento"
            value={searchDocumento}
            onChange={(e) => setSearchDocumento(e.target.value)}
            startContent={<FileText className="w-3.5 h-3.5 text-slate-400" />}
            classNames={glassInputClasses}
            isClearable
            onClear={() => setSearchDocumento('')}
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
        <div className="flex items-center gap-3 w-full xl:w-auto justify-end mt-2 xl:mt-0">
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

          {hasCreatePermission && (
            <Button
              className="bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold rounded-xl shadow-lg shadow-slate-900/20 w-40"
              startContent={<FaPlus className="w-4 h-4 text-white" />}
              onPress={handleNavigation}
            >
              {tipo === 'ingreso' ? 'Nueva Entrada' : 'Nueva Salida'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FiltrosIngresos;