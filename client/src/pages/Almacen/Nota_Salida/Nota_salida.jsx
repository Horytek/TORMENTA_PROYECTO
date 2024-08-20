import { useState, useEffect, useCallback, useRef } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import TablaSalida from './ComponentsNotaSalida/NotaSalidaTable';
import getSalidasData from './data/data_salida';
import useAlmacenData from './data/data_almacen_salida';
import './Nota_salida.css';
import FiltrosSalida from './ComponentsNotaSalida/FiltrosSalida';
import ReactToPrint from 'react-to-print';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
const Salidas = () => {
  const [filters, setFilters] = useState({});
  const [salidas, setSalidas] = useState([]);
  const { almacenes } = useAlmacenData();
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(() => {
    const almacenIdGuardado = localStorage.getItem('almacen');
    return almacenIdGuardado && almacenes ? almacenes.find(a => a.id === parseInt(almacenIdGuardado)) : null;
  });

  const fetchSalidas = useCallback(async () => {
    const data = await getSalidasData(filters);
    setSalidas(data.salida);
  }, [filters]);

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
    setFilters(prevFilters => {
      if (JSON.stringify(prevFilters) !== JSON.stringify(newFilters)) {
        return newFilters;
      }
      return prevFilters;
    });
  };

  const handleAlmacenChange = (almacen) => {
    setAlmacenSeleccionado(almacen);
  };

  const tablaSalidaRef = useRef(null);

  const handlePDFOption = () => {
    if (tablaSalidaRef.current) {
      tablaSalidaRef.current.generatePDFGeneral();
    }
  };
  return (
    <div className="relative min-h-screen pb-7">
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Almacén', href: '/almacen' }, { name: 'Nota de salida', href: '/almacen/nota_salida' }]} />
      <hr className="mb-4" />
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
          Nota de salida
        </h1>
      </div>
      <div className='w-full mb-3 rounded-lg'>
        <table className='w-full text-sm divide-gray-200 rounded-lg table-auto border-collapse'>
          <tbody className="bg-gray-50">
            <tr className='text-center'>
              <td className='border-r-2 border-t-0'> 
                <strong>{almacenSeleccionado ? `SUCURSAL: ${almacenSeleccionado.sucursal}` : 'SUCURSAL: Sin almacén seleccionado'}</strong> <span>{}</span> 
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <FiltrosSalida almacenes={almacenes} onFiltersChange={handleFiltersChange} onAlmacenChange={handleAlmacenChange} onPDFOptionClick={handlePDFOption} />
      <div >
        <TablaSalida ref={tablaSalidaRef} salidas={salidas}  />
      </div>
       {/* <div className='fixed bottom-0 border rounded-t-lg w-full p-2.5' style={{ backgroundColor: '#01BDD6' }}>
        <h1 className="text-xl font-bold" style={{ fontSize: '22px', color: 'white' }}>
          {almacenSeleccionado ? `SUCURSAL: ${almacenSeleccionado.sucursal}` : 'SUCURSAL:'}
        </h1>
      </div> */}
    </div>
  );
};

export default Salidas;
