import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import TablaIngresos from './ComponentsNotaIngreso/NotaIngresoTable';
import useIngresosData from './data/data_ingreso';
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
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(null);

  const handleFiltersChange = async (newFilters) => {
    setFilters(newFilters);
    const data = await useIngresosData(newFilters); // Llama la función para obtener los datos
    setIngresos(data.ingresos); // Establece los ingresos obtenidos en el estado
  };

  const handleAlmacenChange = (almacen) => {
    setAlmacenSeleccionado(almacen);
  };

  return (
    <div>
      {/* Componente de migas de pan */}
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Almacén', href: '/almacen' }, { name: 'Nota de ingreso', href: '/almacen/nota_ingreso' }]} />
      <hr className="mb-4" />
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
          Nota de ingreso
        </h1>
      </div>
      {/* Componente de filtro de ingresos */}
      <FiltrosIngresos onFiltersChange={handleFiltersChange} onAlmacenChange={handleAlmacenChange} />
      {/* Componente de tabla de ingresos */}
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
