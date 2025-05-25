import { useState, useEffect } from "react";
import axios from "@/api/axios";

// Hook para obtener el desempeño de sucursales (ventas y promedio general)
const useDesempenoSucursales = (selectedTab, selectedSucursal) => {
  const [sucursales, setSucursales] = useState([]);
  const [promedioGeneral, setPromedioGeneral] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDesempeno = async () => {
      setLoading(true);
      try {
        const params = { tiempo: selectedTab };
        if (selectedSucursal) params.sucursal = selectedSucursal;
        const response = await axios.get("/dashboard/ventas_por_sucursal", { params });
        if (response.data.code === 1) {
          setSucursales(response.data.data.sucursales || []);
          setPromedioGeneral(response.data.data.promedioGeneral || 0);
        } else {
          setSucursales([]);
          setPromedioGeneral(0);
        }
      } catch (error) {
        setSucursales([]);
        setPromedioGeneral(0);
      } finally {
        setLoading(false);
      }
    };
    fetchDesempeno();
  }, [selectedTab, selectedSucursal]);

  return { sucursales, promedioGeneral, loading };
};

export default useDesempenoSucursales;