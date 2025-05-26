import { useState, useEffect } from "react";
import axios from "@/api/axios";

/**
 * Hook para obtener las notas pendientes (ingreso o salida) por sucursal o de manera general.
 * Si no se pasa idSucursal, consulta general.
 */
function useNotasPendientes({ idSucursal = null }) {
  const [cantidadPendientes, setCantidadPendientes] = useState(0);
  const [totalNotas, setTotalNotas] = useState(0);
  const [notasPendientes, setNotasPendientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotasPendientes = async () => {
      setLoading(true);
      try {
        const params = {};
        if (idSucursal) params.id_sucursal = idSucursal;

        const response = await axios.get("/dashboard/notas_pendientes", { params });
        if (response.data.code === 1) {
          const pendientes = response.data.data || [];
          setNotasPendientes(pendientes);
          setCantidadPendientes(pendientes.length);
          setTotalNotas(pendientes.length); // Puedes cambiar esto si quieres mostrar el total de ingresos/salidas
        } else {
          setNotasPendientes([]);
          setCantidadPendientes(0);
          setTotalNotas(0);
        }
      } catch (error) {
        setNotasPendientes([]);
        setCantidadPendientes(0);
        setTotalNotas(0);
      } finally {
        setLoading(false);
      }
    };

    fetchNotasPendientes();
  }, [idSucursal]);

  return { cantidadPendientes, totalNotas, notasPendientes, loading };
}

export default useNotasPendientes;