import { useState, useEffect, useCallback, useRef } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import TablaNotasAlmacen from './ComponentsNotaIngreso/NotaIngresoTable'; // Unificada
import getIngresosData from './data/data_ingreso';
import getSalidasData from '../Nota_Salida/data/data_salida';
import useAlmacenData from './data/data_almacen_ingreso';
import FiltrosIngresos from './ComponentsNotaIngreso/FiltrosIngreso';
import FiltrosSalida from '../Nota_Salida/ComponentsNotaSalida/FiltrosSalida';
import { Tabs, Tab } from "@heroui/react";
import { RoutePermission } from '@/routes';

const NotasAlmacen = () => {
  const [filtersIngreso, setFiltersIngreso] = useState({});
  const [filtersSalida, setFiltersSalida] = useState({});
  const [ingresos, setIngresos] = useState([]);
  const [salidas, setSalidas] = useState([]);
  const { almacenes } = useAlmacenData();
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(() => {
    const almacenIdGuardado = localStorage.getItem('almacen');
    return almacenIdGuardado && almacenes ? almacenes.find(a => a.id === parseInt(almacenIdGuardado)) : null;
  });
  const [tabActiva, setTabActiva] = useState("ingreso");
  // Referencia para PDF de salidas
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
    const almacenIdGuardado = localStorage.getItem('almacen');
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

  return (
    <div>
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-3xl font-bold">Notas de almacén</h1>
      </div>
      <div className='w-full mb-3 rounded-lg'>
        <table className='w-full text-sm rounded-lg table-auto border-collapse'>
          <tbody className="bg-gray-50">
            <tr className="text-center">
              <td className="border-r-2 border-t-0 p-4">
                <strong className="block text-lg font-semibold font-sans text-gray-800 tracking-wide">
                  {almacenSeleccionado
                    ? `SUCURSAL: ${almacenSeleccionado.sucursal}`
                    : 'SUCURSAL: Sin almacén seleccionado'}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <Tabs
        aria-label="Notas de almacén"
        color="primary"
        selectedKey={tabActiva}
        onSelectionChange={setTabActiva}
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
              <TablaNotasAlmacen registros={Array.isArray(ingresos) ? ingresos : []} tipo="ingreso" />
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
            <TablaNotasAlmacen ref={tablaSalidaRef} registros={Array.isArray(salidas) ? salidas : []} tipo="salida" />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default NotasAlmacen;