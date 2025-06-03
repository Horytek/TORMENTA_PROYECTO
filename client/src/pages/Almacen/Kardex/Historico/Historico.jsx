import HeaderHistorico from './ComponentsHistorico/HeaderHistorico';
import HistoricoTable from './ComponentsHistorico/HistoricoTable';
import { useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import getAllKardexData from '../data/data_detalle_kardex';
import { useUserStore } from "@/store/useStore";

function Historico() {
  const { id } = useParams();
  const [kardexData, setKardexData] = useState([]);
  const [previousTransactions, setPreviousTransactions] = useState(null);
  const [productoData, setProductoData] = useState([]);
  const [dateRange, setDateRange] = useState({
    fechaInicio: null,
    fechaFin: null,
  });

  // Zustand: almacén global
  const almacenGlobal = useUserStore((state) => state.almacen);

  const fetchKardexData = useCallback(async (filters) => {
    const data = await getAllKardexData(filters);
    setKardexData(data.kardex);
    setPreviousTransactions(data.previousTransactions);
    setProductoData(data.productos);
  }, []);

  useEffect(() => {
    if (dateRange.fechaInicio && dateRange.fechaFin && almacenGlobal) {
      const filters = {
        fechaInicio: dateRange.fechaInicio,
        fechaFin: dateRange.fechaFin,
        idProducto: id,
        idAlmacen: almacenGlobal,
      };
      fetchKardexData(filters);
    }
  }, [id, dateRange, almacenGlobal, fetchKardexData]);

  const handleDateChange = useCallback((fechaInicio, fechaFin, almacenId) => {
    setDateRange({ fechaInicio, fechaFin });
    // Si el usuario cambia el almacén desde el header, actualiza el global
    if (almacenId) {
      useUserStore.getState().setAlmacen(almacenId);
    }
  }, []);

  return (
    <div className="w-full">
      <HeaderHistorico
        productId={id}
        productoData={productoData}
        onDateChange={handleDateChange}
        transactions={kardexData}
        previousTransactions={previousTransactions}
        dateRange={dateRange}
      />
      <br />
      <HistoricoTable transactions={kardexData} previousTransactions={previousTransactions} />
    </div>
  );
}

export default Historico;