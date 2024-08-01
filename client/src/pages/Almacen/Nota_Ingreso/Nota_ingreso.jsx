import { useState, useEffect } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import TablaIngresos from './ComponentsNotaIngreso/NotaIngresoTable';
import useIngresosData from './data/data_ingreso';
import useAlmacenData from './data/data_almacen_ingreso'; // Importa los datos del almacén
import './Nota_ingreso.css';
import FiltrosIngresos from './ComponentsNotaIngreso/FiltrosIngreso';

const Ingresos = () => {
  const [filters, setFilters] = useState({
    fecha_i: '',
    fecha_e: '',
    razon: '',
    almacen: '%',
  });
  const [ingresos, setIngresos] = useState([]);
  const { almacenes } = useAlmacenData(); // Obtén los almacenes
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(() => {
    const almacenIdGuardado = localStorage.getItem('almacen');
    return almacenIdGuardado && almacenes ? almacenes.find(a => a.id === parseInt(almacenIdGuardado)) : null;
  });

  useEffect(() => {
    const almacenIdGuardado = localStorage.getItem('almacen');
    if (almacenIdGuardado && almacenes.length > 0) {
      const almacen = almacenes.find(a => a.id === parseInt(almacenIdGuardado));
      if (almacen) {
        setAlmacenSeleccionado(almacen);
      }
    }
  }, [almacenes]);

  const handleFiltersChange = async (newFilters) => {
    setFilters(newFilters);
    const data = await useIngresosData(newFilters);
    setIngresos(data.ingresos);
  };

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
      <FiltrosIngresos almacenes={almacenes} onFiltersChange={handleFiltersChange} onAlmacenChange={handleAlmacenChange} />
      <TablaIngresos ingresos={ingresos} />

      <div className='fixed bottom-0 border rounded-t-lg w-full p-2.5' style={{ backgroundColor: '#01BDD6' }}>
        <h1 className="text-xl font-bold" style={{ fontSize: '22px', color: 'white' }}>
          {almacenSeleccionado ? `SUCURSAL: ${almacenSeleccionado.sucursal}` : 'Seleccione un almacén'}
        </h1>
      </div>
    </div>
  );
};

export default Ingresos;
