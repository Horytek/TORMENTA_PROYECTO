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

  // Ref for printing
  const componentRef = useRef();

  // Function to generate PDF
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("TORMENTA JEANS - 20610588981", 10, 10); // Example text
    const fechaActual = new Date().toLocaleDateString(); // Formato de fecha, cambia según necesidad

    doc.text(`Notas de Salida: ${almacenSeleccionado.almacen} / Fecha: ${fechaActual}`, 10, 20);
    // Generate the table data, replace with actual data
    doc.autoTable({
      startY: 22,
      head: [['Fecha', 'Codigo', 'Header 3']],
      body: salidas.map((salida) => [salida.fecha, salida.documento, salida.fecha]),
    });

    doc.save("NotaSalida.pdf");
  };

  return (
    <div className="relative min-h-screen pb-7">
      <Breadcrumb paths={[{ name: 'Inicio', href: '/inicio' }, { name: 'Almacén', href: '/almacen' }, { name: 'Nota de salida', href: '/almacen/nota_salida' }]} />
      <hr className="mb-4" />
      <div className="flex justify-between mt-5 mb-4">
        <h1 className="text-xl font-bold" style={{ fontSize: '36px' }}>
          Nota de salida
        </h1>
        <div>
          <button onClick={generatePDF}>Generar PDF</button>
          <ReactToPrint
            trigger={() => <button>Imprimir</button>}
            content={() => componentRef.current}
          />
        </div>
      </div>
      <FiltrosSalida almacenes={almacenes} onFiltersChange={handleFiltersChange} onAlmacenChange={handleAlmacenChange} />
      <div ref={componentRef}>
        <TablaSalida salidas={salidas} />
      </div>
      <div className='fixed bottom-0 border rounded-t-lg w-full p-2.5' style={{ backgroundColor: '#01BDD6' }}>
        <h1 className="text-xl font-bold" style={{ fontSize: '22px', color: 'white' }}>
          {almacenSeleccionado ? `SUCURSAL: ${almacenSeleccionado.sucursal}` : 'SUCURSAL:'}
        </h1>
      </div>
    </div>
  );
};

export default Salidas;
