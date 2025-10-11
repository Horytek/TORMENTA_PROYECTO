import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import TablaNotasAlmacen from './ComponentsNotaIngreso/NotaIngresoTable';
import { getNotasIngreso } from '@/services/notaIngreso.services';
import { getNotasSalida } from '@/services/notaSalida.services';
import { useAlmacenesIngreso } from '@/hooks/useNotaIngreso';
import FiltrosIngresos from './ComponentsNotaIngreso/FiltrosIngreso';
import { Tabs, Tab, Select, SelectItem, Chip } from "@heroui/react";
import { RoutePermission } from '@/routes';
import { useUserStore } from "@/store/useStore";

const NotasAlmacen = () => {
  const [filtersIngreso, setFiltersIngreso] = useState({});
  const [filtersSalida, setFiltersSalida] = useState({});
  const [ingresos, setIngresos] = useState([]);
  const [salidas, setSalidas] = useState([]);
  const { almacenes } = useAlmacenesIngreso();
  const almacenGlobal = useUserStore((state) => state.almacen);
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(() => {
    const almacenIdGuardado = almacenGlobal;
    return almacenIdGuardado && almacenes ? almacenes.find(a => a.id === parseInt(almacenIdGuardado)) : null;
  });
  const [tabActiva, setTabActiva] = useState("ingreso");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const tablaSalidaRef = useRef(null);

  // Fetch ingresos
  const fetchIngresos = useCallback(async () => {
    const result = await getNotasIngreso({
      ...filtersIngreso,
      almacen: filtersIngreso.almacen || undefined,
    });
    setIngresos(result.data || []);
  }, [filtersIngreso]);

  const fetchSalidas = useCallback(async () => {
    const result = await getNotasSalida(filtersSalida);
    setSalidas(result.data || []);
  }, [filtersSalida]);

  useEffect(() => { fetchIngresos(); }, [fetchIngresos]);
  useEffect(() => { fetchSalidas(); }, [fetchSalidas]);

  // Función para actualizar el array local cuando se anula una nota
  const handleNotaAnulada = (notaId) => {
    if (tabActiva === "ingreso") {
      setIngresos(prev =>
        prev.map(i => i.id === notaId ? { ...i, estado: 0 } : i)
      );
    } else {
      setSalidas(prev =>
        prev.map(s => s.id === notaId ? { ...s, estado: 0 } : s)
      );
    }
  };

  useEffect(() => {
    const almacenIdGuardado = almacenGlobal;
    if (almacenIdGuardado && almacenes.length > 0) {
      const almacen = almacenes.find(a => a.id === parseInt(almacenIdGuardado));
      if (almacen) setAlmacenSeleccionado(almacen);
    }
  }, [almacenes, almacenGlobal]);

  // Cambio de almacén sincronizado para ambos
  const handleAlmacenChange = (almacen) => {
    setAlmacenSeleccionado(almacen || null);
    // Filtro correcto: 'almacen' (antes 'almacenId')
    setFiltersIngreso(prev => ({ ...prev, almacen: almacen ? almacen.id : '%' }));
    setFiltersSalida(prev => ({ ...prev, almacen: almacen ? almacen.id : '%' }));
  };


    const handleFiltersChange = (newFilters) => {
    if (tabActiva === "ingreso") {
      // Normalizar: si no viene almacen, mantener '%'
      const nf = { ...newFilters };
      if (nf.almacen === undefined || nf.almacen === null) nf.almacen = '%';
      setFiltersIngreso(prev => JSON.stringify(prev) !== JSON.stringify(nf) ? nf : prev);
    } else {
      setFiltersSalida(prev => JSON.stringify(prev) !== JSON.stringify(newFilters) ? newFilters : prev);
    }
  };

  // PDF Salida
  const handlePDFOption = () => {
    if (tablaSalidaRef.current) {
      tablaSalidaRef.current.generatePDFGeneral();
    }
  };

  // Paginación
  const registros = tabActiva === "ingreso" ? ingresos : salidas;
  const totalPages = Math.ceil(registros.length / itemsPerPage) || 1;
  const currentRegistros = useMemo(() => (
    registros.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  ), [registros, currentPage, itemsPerPage]);

  // Métricas para chips
  const totalIngresos = ingresos.length;
  const totalSalidas = salidas.length;

return (
    <div className="min-h-[80vh] px-4 py-8 max-w-8xl mx-auto">
      {/* Header principal */}
      <div className="mb-6 space-y-3">
        <h1 className="font-extrabold text-4xl text-blue-900 dark:text-slate-100 tracking-tight">
          Notas de almacén
        </h1>
        <p className="text-base text-blue-700/80 dark:text-slate-300">
          Administra y busca notas de ingreso y salida fácilmente.
        </p>
      </div>

      {/* Card de contexto + métricas */}
      <div className="mb-6 rounded-2xl bg-white/85 dark:bg-[#18192b]/85 border border-blue-100 dark:border-zinc-700/60 shadow-sm dark:shadow-none px-6 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 backdrop-blur-sm">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">Contexto</span>
          <div className="mt-1 flex items-center gap-2 text-blue-900 dark:text-slate-100 font-medium">
            <span className="text-cyan-600 dark:text-cyan-300 font-semibold">Sucursal:</span>
            {almacenSeleccionado?.sucursal
              ? <span>{almacenSeleccionado.sucursal}</span>
              : <span className="italic text-gray-400 dark:text-gray-400">&mdash;</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip
            size="sm"
            variant="flat"
            color="primary"
            className="text-[11px]"   // antes tenía dark:bg-... y dark:border-...
          >
            Ingresos: {totalIngresos}
          </Chip>
          <Chip
            size="sm"
            variant="flat"
            color="secondary"
            className="text-[11px]"
          >
            Salidas: {totalSalidas}
          </Chip>
          <Chip
            size="sm"
            variant="flat"
            color="success"
            className="text-[11px]"
          >
            Página {currentPage}/{totalPages}
          </Chip>
        </div>
      </div>

      {/* Tabs + filtros (tabla NO se toca) */}
      <div className="mb-2">
        <Tabs
          aria-label="Notas de almacén"
          color="primary"
          selectedKey={tabActiva}
          onSelectionChange={setTabActiva}
          classNames={{
            tabList:
              "relative flex gap-2 bg-blue-50/60 dark:bg-zinc-800/50 border border-blue-100/60 dark:border-zinc-700/60 p-1 rounded-xl w-fit",
            cursor: "bg-blue-600 dark:bg-blue-500 shadow",
            tab:
              "px-5 py-2 text-sm font-semibold rounded-lg data-[hover=true]:bg-blue-100/80 dark:data-[hover=true]:bg-zinc-700/60 dark:text-slate-200",
            tabContent:
              "group-data-[selected=true]:text-white text-blue-700 dark:text-slate-200 dark:group-data-[selected=true]:text-white",
          }}
        >
          <Tab key="ingreso" title="Notas de ingreso">
            {/* Contenedor filtros */}
            <div className="mb-4 rounded-xl border border-blue-100/70 dark:border-zinc-700/60 bg-white/85 dark:bg-[#18192b]/80 backdrop-blur-sm shadow-sm">
              <FiltrosIngresos
                almacenes={almacenes}
                onFiltersChange={handleFiltersChange}
                onAlmacenChange={handleAlmacenChange}
                ingresos={ingresos}
                almacenSseleccionado={almacenSeleccionado}
                tipo="ingreso"
              />
            </div>
            {/* --- NO MODIFICAR BLOQUE TABLA --- */}
            <div>
              <RoutePermission idModulo={10} idSubmodulo={10}>
                <TablaNotasAlmacen
                  registros={currentRegistros}
                  tipo="ingreso"
                  onNotaAnulada={handleNotaAnulada}
                />
              </RoutePermission>
            </div>
          </Tab>

          <Tab key="salida" title="Notas de salida">
            <div className="mb-4 rounded-xl border border-blue-100/70 dark:border-zinc-700/60 bg-white/85 dark:bg-[#18192b]/80 backdrop-blur-sm shadow-sm">
              <FiltrosIngresos
                almacenes={almacenes}
                onFiltersChange={handleFiltersChange}
                onAlmacenChange={handleAlmacenChange}
                ingresos={salidas}
                almacenSseleccionado={almacenSeleccionado}
                tipo="salida"
              />
            </div>
            {/* --- NO MODIFICAR BLOQUE TABLA --- */}
            <div>
              <TablaNotasAlmacen
                ref={tablaSalidaRef}
                registros={currentRegistros}
                tipo="salida"
                onNotaAnulada={handleNotaAnulada}
              />
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default NotasAlmacen;