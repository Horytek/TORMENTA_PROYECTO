import { useState } from "react";
import axios from "@/api/axios";

/**
 * Hook para actualizar el estado_espera de una nota por num_comprobante.
 * @returns {Function} actualizarEstadoEspera - Recibe el num_comprobante y actualiza el campo en backend.
 */
const useActualizarEspera = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Actualiza el campo estado_espera=1 para la(s) nota(s) con ese num_comprobante.
   * @param {string} num_comprobante
   * @returns {Promise<boolean>} true si fue exitoso, false si hubo error
   */
  const actualizarEstadoEspera = async (num_comprobante) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post("/dashboard/actualizar_espera", {
        num_comprobante
      });
      setLoading(false);
      return response.data.code === 1;
    } catch (error) {
      setError(error);
      setLoading(false);
      return false;
    }
  };

  return { actualizarEstadoEspera, loading, error };
};

export default useActualizarEspera;