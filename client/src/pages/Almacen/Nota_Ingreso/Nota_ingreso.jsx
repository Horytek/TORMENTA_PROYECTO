import { useState, useEffect, useCallback, useRef } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import TablaNotasAlmacen from './ComponentsNotaIngreso/NotaIngresoTable';
import getIngresosData from './data/data_ingreso';
import getSalidasData from '../Nota_Salida/data/data_salida';
import useAlmacenData from './data/data_almacen_ingreso';
import FiltrosIngresos from './ComponentsNotaIngreso/FiltrosIngreso';
import FiltrosSalida from '../Nota_Salida/ComponentsNotaSalida/FiltrosSalida';
import { Tabs, Tab, Select, SelectItem } from "@heroui/react";
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
      almacenId: filtersIngreso.almacenId || undefined,
    });
    setIngresos(data.ingresos);
  }, [filtersIngreso]);

  // Fetch salidas
  const fetchSalidas = useCallback(async () => {
    const data = await getSalidasData(filtersSalida);
    setSalidas(data.salida);
  }, [filtersSalida]);

  useEffect(() => {
    fetchIngresos();
  }, [fetchIngresos]);

  useEffect(() => {
    fetchSalidas();
  }, [fetchSalidas]);

  useEffect(() => {
    const almacenIdGuardado = almacenGlobal;
    if (almacenIdGuardado && almacenes.length > 0) {
      const almacen = almacenes.find(a => a.id === parseInt(almacenIdGuardado));
      if (almacen) {
        setAlmacenSeleccionado(almacen);
      }
    }
  }, [almacenes]);

  const handleFiltersChange = (newFilters) => {
    if (tabActiva === "ingreso") {
      setFiltersIngreso(prevFilters => {
        if (JSON.stringify(prevFilters) !== JSON.stringify(newFilters)) {
          return newFilters;
        }
        return prevFilters;
      });
    } else {
      setFiltersSalida(prevFilters => {
        if (JSON.stringify(prevFilters) !== JSON.stringify(newFilters)) {
          return newFilters;
        }
        return prevFilters;
      });
    }
  };

  // Cambio de almacén sincronizado para ambos
  const handleAlmacenChange = (almacen) => {
    setAlmacenSeleccionado(almacen || null);
    setFiltersIngreso((prev) => ({
      ...prev,
      almacenId: almacen ? almacen.id : null,
    }));
    setFiltersSalida((prev) => ({
      ...prev,
      almacen: almacen ? almacen.id : null,
    }));
  };

  // PDF Salida
  const handlePDFOption = () => {
    if (tablaSalidaRef.current) {
      tablaSalidaRef.current.generatePDFGeneral();
    }
  };

  // Paginación
  const registros = tabActiva === "ingreso" ? ingresos : salidas;
  const totalPages = Math.ceil(registros.length / itemsPerPage);
  const currentRegistros = registros.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

 return (
  <div className="min-h-[80vh] px-4 py-8 max-w-8xl mx-auto bg-gradient-to-b from-white via-blue-50/40 to-blue-50/80">
    <h1 className="font-extrabold text-4xl text-blue-900 tracking-tight mb-1">Notas de almacén</h1>
    <p className="text-base text-blue-700/80 mb-6">Administra y busca notas de ingreso y salida fácilmente.</p>
<div className="w-full mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
  <div className="flex-1 flex items-center">
    <div className="rounded-2xl w-full max-w-2xl bg-white/80 border border-blue-100 shadow-sm px-8 py-4 flex items-center transition-all">
      <span className="block text-lg font-semibold font-sans tracking-wide text-blue-900 flex items-center gap-2">
        <span className="text-cyan-600 font-bold">Sucursal:</span>
        {almacenSeleccionado && almacenSeleccionado.sucursal ? (
          <span className="text-blue-900">{almacenSeleccionado.sucursal}</span>
        ) : (
          <span className="text-gray-400 italic select-none">&mdash;</span>
        )}
      </span>
    </div>
  </div>
</div>
    <div className="mb-2">
      <Tabs
        aria-label="Notas de almacén"
        color="primary"
        selectedKey={tabActiva}
        onSelectionChange={setTabActiva}
        classNames={{
          tabList: "bg-transparent",
          tab: "rounded-xl px-6 py-2 text-base font-semibold",
          tabActive: "bg-blue-600 text-white shadow",
          tabInactive: "bg-blue-50 text-blue-700 hover:bg-blue-100"
        }}
      >
        <Tab key="ingreso" title="Notas de ingreso">
          <FiltrosIngresos
            almacenes={almacenes}
            onFiltersChange={handleFiltersChange}
            onAlmacenChange={handleAlmacenChange}
            ingresos={ingresos}
            almacenSseleccionado={almacenSeleccionado}
            tipo="ingreso"
          />
          <div>
            <RoutePermission idModulo={10} idSubmodulo={10}>
              <TablaNotasAlmacen
                registros={currentRegistros}
                tipo="ingreso"
              />
            </RoutePermission>
          </div>
        </Tab>
        <Tab key="salida" title="Notas de salida">
          <FiltrosIngresos
            almacenes={almacenes}
            onFiltersChange={handleFiltersChange}
            onAlmacenChange={handleAlmacenChange}
            ingresos={salidas}
            almacenSseleccionado={almacenSeleccionado}
            tipo="salida"
          />
          <div>
            <TablaNotasAlmacen
              ref={tablaSalidaRef}
              registros={currentRegistros}
              tipo="salida"
            />
          </div>
        </Tab>
      </Tabs>
    </div>
  </div>
);
};

export default NotasAlmacen;