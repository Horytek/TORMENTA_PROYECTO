import './Historico.css';
import HeaderHistorico from './ComponentsHistorico/HeaderHistorico';
import HistoricoTable from './ComponentsHistorico/HistoricoTable';
import { useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import getAllKardexData from '../data/data_detalle_kardex';

function Historico() {
  const { id } = useParams();
  const [kardexData, setKardexData] = useState([]);
  const [previousTransactions, setPreviousTransactions] = useState(null);
  const [productoData, setProductoData] = useState([]);
  const [dateRange, setDateRange] = useState({
    fechaInicio: null,
    fechaFin: null,
  });

  const fetchKardexData = useCallback(async (filters) => {
    const data = await getAllKardexData(filters);
    setKardexData(data.kardex);
    setPreviousTransactions(data.previousTransactions);
    setProductoData(data.productos);
  }, []);

  useEffect(() => {
    if (dateRange.fechaInicio && dateRange.fechaFin) {
      const idAlmacen = localStorage.getItem('almacen');
      const filters = {
        fechaInicio: dateRange.fechaInicio,
        fechaFin: dateRange.fechaFin,
        idProducto: id,
        idAlmacen,
      };

      fetchKardexData(filters);
    }
  }, [id, dateRange, fetchKardexData]);

  const handleDateChange = useCallback((fechaInicio, fechaFin) => {
    setDateRange({ fechaInicio, fechaFin });
  }, []);

  return (
    <div className="Historico">
      <HeaderHistorico productId={id} productoData={productoData} onDateChange={handleDateChange}  transactions={kardexData} previousTransactions={previousTransactions} dateRange={dateRange}/>
      <br />
      <HistoricoTable transactions={kardexData} previousTransactions={previousTransactions} />
    </div>
  );
}

export default Historico;
