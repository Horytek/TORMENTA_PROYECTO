import { useState, useEffect, useCallback, useRef } from 'react';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import TablaSalida from './ComponentsNotaSalida/NotaSalidaTable';
import { getNotasSalida } from '@/services/notaSalida.services';
import { useAlmacenesSalida } from '@/hooks/useNotaSalida';
import FiltrosSalida from './ComponentsNotaSalida/FiltrosSalida';
import ReactToPrint from 'react-to-print';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const Salidas = () => {
  const [filters, setFilters] = useState({});
  const [salidas, setSalidas] = useState([]);
  const { almacenes } = useAlmacenesSalida();
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(() => {
    const almacenIdGuardado = localStorage.getItem('almacen');
    return almacenIdGuardado && almacenes
      ? almacenes.find(a => a.id === parseInt(almacenIdGuardado))
      : null;
  });

  const fetchSalidas = useCallback(async () => {
    const result = await getNotasSalida(filters);
    setSalidas(result.data || []);
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

  // Función para actualizar el array local cuando se anula una nota
  const handleNotaAnulada = (notaId) => {
    setSalidas(prev => 
      prev.map(salida => 
        salida.id === notaId 
          ? { ...salida, estado: 0 } // Asumiendo que 0 es el estado anulado
          : salida
      )
    );
  };

  const tablaSalidaRef = useRef(null);

  const handlePDFOption = () => {
    if (tablaSalidaRef.current) {
      tablaSalidaRef.current.generatePDFGeneral();
    }
  };

  return (
    <div>
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-4xl font-bold">Nota de salida</h1>
      </div>

      <div className="w-full mb-3 rounded-lg">
        <table className="w-full text-sm divide-gray-200 rounded-lg table-auto border-collapse">
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

      <FiltrosSalida
        almacenes={almacenes}
        onFiltersChange={handleFiltersChange}
        onAlmacenChange={handleAlmacenChange}
        onPDFOptionClick={handlePDFOption}
      />

      <div>
        <TablaSalida ref={tablaSalidaRef} salidas={salidas} onNotaAnulada={handleNotaAnulada} />
      </div>

      {/* Example of converting inline styles to Tailwind (kept commented) */}
      {/*
      <div className="fixed bottom-0 border rounded-t-lg w-full p-2.5 bg-[#01BDD6]">
        <h1 className="text-2xl font-bold text-white">
          {almacenSeleccionado
            ? `SUCURSAL: ${almacenSeleccionado.sucursal}`
            : 'SUCURSAL:'}
        </h1>
      </div>
      */}

    </div>
  );
};

export default Salidas;
