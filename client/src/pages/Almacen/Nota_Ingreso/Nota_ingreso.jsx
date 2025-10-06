import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import TablaNotasAlmacen from './ComponentsNotaIngreso/NotaIngresoTable';
import getIngresosData from './data/data_ingreso';
import getSalidasData from '../Nota_Salida/data/data_salida';
import useAlmacenData from './data/data_almacen_ingreso';
import FiltrosIngresos from './ComponentsNotaIngreso/FiltrosIngreso';
import { Tabs, Tab, Select, SelectItem, Chip } from "@heroui/react";
import { RoutePermission } from '@/routes';
import { useUserStore } from "@/store/useStore";

const NotasAlmacen = () => {
  const [filtersIngreso, setFiltersIngreso] = useState({});
  const [filtersSalida, setFiltersSalida] = useState({});
  const [ingresos, setIngresos] = useState([]);
  const [salidas, setSalidas] = useState([]);
  const { almacenes } = useAlmacenData();
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
    const data = await getIngresosData({
      ...filtersIngreso,
      // Asegurar nombre correcto del parámetro que el backend espera
      almacen: filtersIngreso.almacen || undefined,
    });
    setIngresos(data.ingresos || []);
  }, [filtersIngreso]);

  const fetchSalidas = useCallback(async () => {
    const data = await getSalidasData(filtersSalida);
    setSalidas(data.salida || []);
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
        <h1 className="font-extrabold text-4xl text-blue-900 tracking-tight">
          Notas de almacén
        </h1>
        <p className="text-base text-blue-700/80">
          Administra y busca notas de ingreso y salida fácilmente.
        </p>
      </div>

      {/* Card de contexto + métricas */}
      <div className="mb-6 rounded-2xl bg-white/85 border border-blue-100 shadow-sm px-6 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 backdrop-blur-sm">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">Contexto</span>
          <div className="mt-1 flex items-center gap-2 text-blue-900 font-medium">
            <span className="text-cyan-600 font-semibold">Sucursal:</span>
            {almacenSeleccionado?.sucursal
              ? <span>{almacenSeleccionado.sucursal}</span>
              : <span className="italic text-gray-400">&mdash;</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip size="sm" variant="flat" color="primary" className="text-[11px]">Ingresos: {totalIngresos}</Chip>
            <Chip size="sm" variant="flat" color="secondary" className="text-[11px]">Salidas: {totalSalidas}</Chip>
          <Chip size="sm" variant="flat" color="success" className="text-[11px]">
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
            tabList: "relative flex gap-2 bg-blue-50/60 p-1 rounded-xl w-fit",
            cursor: "bg-blue-600 shadow",
            tab: "px-5 py-2 text-sm font-semibold rounded-lg data-[hover=true]:bg-blue-100/80",
            tabContent: "group-data-[selected=true]:text-white text-blue-700"
          }}
        >
          <Tab key="ingreso" title="Notas de ingreso">
            {/* Contenedor filtros */}
            <div className="mb-4 rounded-xl border border-blue-100/70 bg-white/85 backdrop-blur-sm shadow-sm p-4">
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
            <div className="mb-4 rounded-xl border border-blue-100/70 bg-white/85 backdrop-blur-sm shadow-sm p-4">
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