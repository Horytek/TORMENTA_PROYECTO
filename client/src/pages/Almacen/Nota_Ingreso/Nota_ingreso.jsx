import { useState } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import TablaIngresos from './ComponentsNotaIngreso/NotaIngresoTable';
import useIngresosData from './data/Nota_Ingreso_Data';
import ConfirmationModal from '@/pages/Almacen/Nota_Salida/ComponentsNotaSalida/Modals/ConfirmationModal';
import './Nota_ingreso.css';
import FiltrosIngresos from './ComponentsNotaIngreso/FiltrosIngreso';

const Ingresos = () => {
  const { ingresos } = useIngresosData();
  const [isModalOpenImprimir, setIsModalOpenImprimir] = useState(false);
  const [isModalOpenExcel, setIsModalOpenExcel] = useState(false);
  const [isModalOpenExcelDetalle, setIsModalOpenExcelDetalle] = useState(false);
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(null);

  const openModalImprimir = () => {
    setIsModalOpenImprimir(true);
  };

  const closeModalImprimir = () => {
    setIsModalOpenImprimir(false);
  };

  const openModalExcel = () => {
    setIsModalOpenExcel(true);
  };

  const closeModalExcel = () => {
    setIsModalOpenExcel(false);
  };

  const openModalExcelDetalle = () => {
    setIsModalOpenExcelDetalle(true);
  };

  const closeModalExcelDetalle = () => {
    setIsModalOpenExcelDetalle(false);
  };

  const handleConfirmImprimir = () => {
    console.log('Nota de salida impresa.');
    setIsModalOpenImprimir(false);
  };

  const handleConfirmExcel = () => {
    console.log('Exportar a Excel.');
    setIsModalOpenExcel(false);
  };

  const handleConfirmExcelDetalle = () => {
    console.log('Exportar a Excel Detalle.');
    setIsModalOpenExcelDetalle(false);
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
      <FiltrosIngresos onAlmacenChange={handleAlmacenChange} />
      {/* Componente de tabla de ingresos */}
      <TablaIngresos ingresos={ingresos} />
      {isModalOpenImprimir && (
        <ConfirmationModal
          message='¿Desea imprimir la nota de ingreso?'
          onClose={closeModalImprimir}
          isOpen={isModalOpenImprimir}
          onConfirm={handleConfirmImprimir}
        />
      )}
      {isModalOpenExcel && (
        <ConfirmationModal
          message='¿Desea exportar a Excel?'
          onClose={closeModalExcel}
          isOpen={isModalOpenExcel}
          onConfirm={handleConfirmExcel}
        />
      )}
      {isModalOpenExcelDetalle && (
        <ConfirmationModal
          message='¿Desea exportar a Excel Detalle?'
          onClose={closeModalExcelDetalle}
          isOpen={isModalOpenExcelDetalle}
          onConfirm={handleConfirmExcelDetalle}
        />
      )}
      <div className='fixed bottom-0 border rounded-t-lg w-full p-2.5' style={{ backgroundColor: '#01BDD6' }}>
        <h1 className="text-xl font-bold" style={{ fontSize: '22px', color: 'white' }}>
          {almacenSeleccionado ? `SUCURSAL: ${almacenSeleccionado.sucursal}` : 'Seleccione un almacén'}
        </h1>
      </div>
    </div>
  );
};

export default Ingresos;
