import { useState, useEffect, useCallback } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import TablaIngresos from './ComponentsNotaIngreso/NotaIngresoTable';
import getIngresosData from './data/data_ingreso';
import useAlmacenData from './data/data_almacen_ingreso';
import './Nota_ingreso.css';
import FiltrosIngresos from './ComponentsNotaIngreso/FiltrosIngreso';

const Ingresos = () => {
  const [filters, setFilters] = useState({

  });
  const [ingresos, setIngresos] = useState([]);
  const { almacenes } = useAlmacenData();
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(() => {
    const almacenIdGuardado = localStorage.getItem('almacen');
    return almacenIdGuardado && almacenes ? almacenes.find(a => a.id === parseInt(almacenIdGuardado)) : null;
  });

  // Función para obtener datos de ingresos
  const fetchIngresos = useCallback(async () => {
    const data = await getIngresosData(filters);
    setIngresos(data.ingresos);
  }, [filters]); // Solo depende de filters

  // Llamada a la API cuando cambian los filtros
  useEffect(() => {
    fetchIngresos();
  }, [fetchIngresos]); // Solo depende de fetchIngresos

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
    setAlmacenSeleccionado(almacen);
  };

  return (
    <div>
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Almacén', href: '/almacen' }, { name: 'Nota de ingreso', href: '/almacen/nota_ingreso' }]} />
      <hr className="mb-4" />
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
          Nota de ingreso
        </h1>
      </div>
      <FiltrosIngresos almacenes={almacenes} onFiltersChange={handleFiltersChange} onAlmacenChange={handleAlmacenChange}  ingresos={ingresos} almacenSseleccionado={almacenSeleccionado} />
      <TablaIngresos ingresos={ingresos} />

      <div className='fixed bottom-0 border rounded-t-lg w-full p-2.5' style={{ backgroundColor: '#01BDD6' }}>
        <h1 className="text-xl font-bold" style={{ fontSize: '22px', color: 'white' }}>
          {almacenSeleccionado ? `SUCURSAL: ${almacenSeleccionado.sucursal}` : 'SUCURSAL:'}
        </h1>
      </div>
    </div>
  );
};

export default Ingresos;
