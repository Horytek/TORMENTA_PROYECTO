import { useState, useEffect, useCallback } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import TablaIngresos from './ComponentsNotaIngreso/NotaIngresoTable';
import getIngresosData from './data/data_ingreso';
import useAlmacenData from './data/data_almacen_ingreso';
import FiltrosIngresos from './ComponentsNotaIngreso/FiltrosIngreso';
import { RoutePermission } from '@/routes';

const Ingresos = () => {
  const [filters, setFilters] = useState({});
  const [ingresos, setIngresos] = useState([]);
  const { almacenes } = useAlmacenData();
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(() => {
    const almacenIdGuardado = localStorage.getItem('almacen');
    return almacenIdGuardado && almacenes ? almacenes.find(a => a.id === parseInt(almacenIdGuardado)) : null;
  });

  const fetchIngresos = useCallback(async () => {
    const data = await getIngresosData({
      ...filters,
      almacenId: filters.almacenId || undefined,
    });
    setIngresos(data.ingresos);
  }, [filters]);

  useEffect(() => {
    fetchIngresos();
  }, [fetchIngresos]); 

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
    setFilters(prevFilters => {
      if (JSON.stringify(prevFilters) !== JSON.stringify(newFilters)) {
        return newFilters;
      }
      return prevFilters;
    });
  };

  const currentDate = new Date().toLocaleDateString('es-ES');

  const handleAlmacenChange = (almacen) => {
    setAlmacenSeleccionado(almacen || null);
    setFilters((prevFilters) => ({
      ...prevFilters,
      almacenId: almacen ? almacen.id : null,
    }));
  };

  return (
    <div>
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-3xl font-bold">
          Nota de ingreso
        </h1>
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
      <FiltrosIngresos
        almacenes={almacenes}
        onFiltersChange={handleFiltersChange}
        onAlmacenChange={handleAlmacenChange}
        ingresos={ingresos}
        almacenSseleccionado={almacenSeleccionado}
      />
      <div>
        <RoutePermission idModulo={10} idSubmodulo={10}>
          <TablaIngresos ingresos={ingresos} />
        </RoutePermission>
      </div>
    </div>
  );
};

export default Ingresos;
