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
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(() => {
    if (almacenGlobal && almacenGlobal !== "%") return almacenGlobal;
    return "";
  });

  // Sincroniza el estado local con Zustand si cambia (solo si es ID válido)
  useEffect(() => {
    if (almacenGlobal && almacenGlobal !== "%" && almacenGlobal !== almacenSeleccionado) {
      setAlmacenSeleccionado(almacenGlobal);
    }
  }, [almacenGlobal]);

  // Si no hay almacén seleccionado (o es %) y hay almacenes, selecciona el primero
  useEffect(() => {
    if ((!almacenSeleccionado || almacenSeleccionado === "%") && almacenes.length > 0) {
      const firstId = almacenes[0].id.toString();
      setAlmacenSeleccionado(firstId);
      setAlmacenGlobal(firstId);
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
    <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#09090b] p-4 md:p-6 space-y-6 transition-colors duration-300">
      <HeaderHistorico
        productId={id}
        productoData={productoData}
        onDateChange={handleDateChange}
        transactions={kardexData}
        previousTransactions={previousTransactions}
        dateRange={dateRange}
        almacenSeleccionado={almacenSeleccionado}
      />
      <HistoricoTable
        transactions={kardexData}
        previousTransactions={previousTransactions}
        productoData={productoData}
      />
    </div>
  );
}

export default Historico;