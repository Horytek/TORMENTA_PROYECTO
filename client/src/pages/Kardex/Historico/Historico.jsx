import HeaderHistorico from './ComponentsHistorico/HeaderHistorico';
import HistoricoTable from './ComponentsHistorico/HistoricoTable';
import { useParams, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { getDetalleKardexCompleto } from '@/services/kardex.services';
import { getProductAttributes } from "@/services/productos.services";
import { useAlmacenesKardex } from '@/hooks/useKardex';
import { useUserStore } from "@/store/useStore";

function Historico() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { almacenes } = useAlmacenesKardex();
  const almacenGlobal = useUserStore((state) => state.almacen);
  const setAlmacenGlobal = useUserStore((state) => state.setAlmacen);

  // Estado local para el almacén seleccionado
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(() => {
    // 1. Prioridad: URL param
    const paramAlmacen = searchParams.get("almacen");
    if (paramAlmacen) return paramAlmacen;

    // 2. Prioridad: Global Store
    if (almacenGlobal && almacenGlobal !== "%") return almacenGlobal;

    return "";
  });

  // Sincronizar URL cuando cambia la selección
  useEffect(() => {
    if (almacenSeleccionado && almacenSeleccionado !== "%") {
      setSearchParams(prev => {
        prev.set("almacen", almacenSeleccionado);
        return prev;
      }, { replace: true });
    }
  }, [almacenSeleccionado, setSearchParams]);

  // Sincroniza el estado local con Zustand si cambia (solo si es ID válido)
  // NOTA: Esto maneja la navegación interna cuando el store global cambia
  useEffect(() => {
    // Si la URL ya tiene un valor, y es diferente al global (ej: reload), la URL gana en el init,
    // pero si navegamos, el global debería mandar. 
    // Para simplificar: Si el global cambia Y no tenemos nada en URL o es diferente, actualizamos.
    // Pero cuidado con el reload. En reload global es "".
    if (almacenGlobal && almacenGlobal !== "%" && almacenGlobal !== almacenSeleccionado) {
      // Verificar si no está conflicto con URL actual?
      // Generalmente si cambiamos el global es porque el usuario cambió de contexto en el sidebar/header
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
  const [attrMetadataMap, setAttrMetadataMap] = useState({});
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

  // Fetch Metadata
  useEffect(() => {
    if (!id) return;
    getProductAttributes(id).then(data => {
      if (data && data.attributes) {
        const names = {};
        const colors = {};
        data.attributes.forEach(a => {
          names[a.id_atributo] = a.nombre;
          if (a.hex) colors[a.nombre] = a.hex;
        });
        setAttrMetadataMap({ [id]: { names, colors } });
      }
    }).catch(console.error);
  }, [id]);

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
        attrMetadataMap={attrMetadataMap}
      />
      <HistoricoTable
        transactions={kardexData}
        previousTransactions={previousTransactions}
        productoData={productoData}
        attrMetadataMap={attrMetadataMap}
      />
    </div>
  );
}

export default Historico;