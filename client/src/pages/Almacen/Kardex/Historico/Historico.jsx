import HeaderHistorico from './ComponentsHistorico/HeaderHistorico';
import HistoricoTable from './ComponentsHistorico/HistoricoTable';
import { useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { getDetalleKardexCompleto } from '@/services/kardex.services';
import { useAlmacenesKardex } from '@/hooks/useKardex';
import { useUserStore } from "@/store/useStore";

function Historico() {
  const { id } = useParams();
  const { almacenes } = useAlmacenesKardex();
  const almacenGlobal = useUserStore((state) => state.almacen);
  const setAlmacenGlobal = useUserStore((state) => state.setAlmacen);

  // Estado local para el almacén seleccionado
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(almacenGlobal || "");

  // Sincroniza el estado local con Zustand si cambia
  useEffect(() => {
    if (almacenGlobal && almacenGlobal !== almacenSeleccionado) {
      setAlmacenSeleccionado(almacenGlobal);
    }
  }, [almacenGlobal]);

  // Si no hay almacén seleccionado y hay almacenes, selecciona el primero
  useEffect(() => {
    if (!almacenSeleccionado && almacenes.length > 0) {
      setAlmacenSeleccionado(almacenes[0].id.toString());
      setAlmacenGlobal(almacenes[0].id.toString());
    }
  }, [almacenes, almacenSeleccionado, setAlmacenGlobal]);

  const [kardexData, setKardexData] = useState([]);
  const [previousTransactions, setPreviousTransactions] = useState([]);
  const [productoData, setProductoData] = useState([]);
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [dateRange, setDateRange] = useState({
    fechaInicio: firstDay.toISOString().split("T")[0],
    fechaFin: lastDay.toISOString().split("T")[0],
  });

  const fetchKardexData = useCallback(async (filters) => {
    const data = await getDetalleKardexCompleto(filters);
    if (data.success) {
      setKardexData(data.kardex);
      setPreviousTransactions(data.previousTransactions || []);
      setProductoData(data.productos);
    }
  }, []);

  useEffect(() => {
    if (dateRange.fechaInicio && dateRange.fechaFin && almacenSeleccionado) {
      const filters = {
        fechaInicio: dateRange.fechaInicio,
        fechaFin: dateRange.fechaFin,
        idProducto: id,
        idAlmacen: almacenSeleccionado,
      };
      fetchKardexData(filters);
    }
  }, [id, dateRange, almacenSeleccionado, fetchKardexData]);

  const handleDateChange = useCallback((fechaInicio, fechaFin, almacenId) => {
    setDateRange({ fechaInicio, fechaFin });
    if (almacenId && almacenId !== almacenSeleccionado) {
      setAlmacenSeleccionado(almacenId);
      setAlmacenGlobal(almacenId);
    }
  }, [almacenSeleccionado, setAlmacenGlobal]);

  return (
    <div className="w-full">
      <HeaderHistorico
        productId={id}
        productoData={productoData}
        onDateChange={handleDateChange}
        transactions={kardexData}
        previousTransactions={previousTransactions}
        dateRange={dateRange}
        almacenSeleccionado={almacenSeleccionado}
      />
      <br />
      <HistoricoTable
  transactions={kardexData}
  previousTransactions={previousTransactions}
  productoData={productoData}
/>
    </div>
  );
}

export default Historico;