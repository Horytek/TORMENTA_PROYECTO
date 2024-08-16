import './HeaderHistorico.css';
import { MdOutlineLocalPrintshop } from "react-icons/md";
import { FaRegFileExcel } from "react-icons/fa";
import { ButtonNormal } from '@/components/Buttons/Buttons';
import { DateRangePicker } from "@nextui-org/date-picker";
import useAlmacenData from '../../data/data_almacen_kardex';
import { useState, useEffect } from 'react';

function HeaderHistorico({ productId, productoData, onDateChange }) {
  const { almacenes } = useAlmacenData();
  const [selectedAlmacen, setSelectedAlmacen] = useState('');
  const [selectedDates, setSelectedDates] = useState({
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    // Set initial almacen from localStorage
    const storedAlmacenId = localStorage.getItem('almacen');
    if (storedAlmacenId) {
      setSelectedAlmacen(storedAlmacenId);
    }

    // Calculate initial date range (2 months before today)
    const today = new Date();
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(today.getMonth() - 2);

    setSelectedDates({
      startDate: twoMonthsAgo,
      endDate: today,
    });

    // Format dates as YYYY-MM-DD
    const formattedStartDate = twoMonthsAgo.toISOString().split('T')[0];
    const formattedEndDate = today.toISOString().split('T')[0];

    // Trigger the callback to fetch data with the initial date range
    onDateChange(formattedStartDate, formattedEndDate);
  }, []);

  const handleAlmacenChange = (event) => {
    const selectedId = event.target.value;
    setSelectedAlmacen(selectedId);
    localStorage.setItem('almacen', selectedId);
  };

  const handleDateChange = (range) => {
    const [start, end] = range;
    setSelectedDates({ startDate: start, endDate: end });

    // Format dates as YYYY-MM-DD
    const formattedStartDate = start.toISOString().split('T')[0];
    const formattedEndDate = end.toISOString().split('T')[0];

    // Trigger the callback to fetch data with the updated date range
    onDateChange(formattedStartDate, formattedEndDate);
  };

  return (
    <div className="headerHistorico">
      <div className="info">
        <p>TORMENTA JEANS - 20610968801</p>
        <p>
          Producto: 
          {productoData.length > 0 ? `${productoData[0].descripcion} - ${productoData[0].marca}` : 'Cargando...'}
        </p>
        <p>
          COD: {productoData.length > 0 ? productoData[0].codigo : 'Cargando...'} / 
          Stock Actual: {productoData.length > 0 ? productoData[0].stock : 'Cargando...'} UND / 
          Marca: {productoData.length > 0 ? productoData[0].marca : 'Cargando...'}
        </p>
        <br />
        <div className="fecha-container">
          <h6 className='font-bold'>Fecha:&nbsp;</h6>
          <DateRangePicker
            className="w-100"
            classNames={{ inputWrapper: "bg-white date-range-picker" }}
            value={[selectedDates.startDate, selectedDates.endDate]}
            onChange={handleDateChange}
          />
        </div>
      </div>
      <div className="actions">
        <ButtonNormal color={'#01BDD6'}>
          <MdOutlineLocalPrintshop className="inline-block text-lg" /> IMPRIMIR
        </ButtonNormal>
        <ButtonNormal color={'#01BDD6'}>
          <FaRegFileExcel className="inline-block text-lg" /> EXCEL
        </ButtonNormal>
        <select 
          value={selectedAlmacen} 
          onChange={handleAlmacenChange} 
          disabled={almacenes.length === 0}>
          {almacenes.map((almacen) => (
            <option key={almacen.id} value={almacen.id}>
              {almacen.almacen}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default HeaderHistorico;
