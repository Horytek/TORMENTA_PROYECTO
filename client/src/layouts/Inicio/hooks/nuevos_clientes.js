import { useState, useEffect } from "react";
import axios from "@/api/axios";
import { useUserStore } from "@/store/useStore";

const useNuevosClientes = (timePeriod, sucursal = "") => {
    const [nuevosClientes, setNuevosClientes] = useState(0);
    const [nuevosClientesAnterior, setNuevosClientesAnterior] = useState(0);
    const [percentageChange, setPercentageChange] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const nombre = useUserStore(state => state.nombre);

    useEffect(() => {
        const fetchNuevosClientes = async () => {
            try {
                setLoading(true);
                const params = { tiempo: timePeriod, usuario: nombre };
                if (sucursal) params.sucursal = sucursal;

                const response = await axios.get("/dashboard/nuevos_clientes", { params });
                const { nuevosClientes: total, nuevosClientesAnterior: anterior, cambio } = response.data;

                setNuevosClientes(total || 0);
                setNuevosClientesAnterior(anterior || 0);
                setPercentageChange(Number(cambio) || 0);
                setError(null);
            } catch (err) {
                setError(err);
                setNuevosClientes(0);
                setNuevosClientesAnterior(0);
                setPercentageChange(0);
            } finally {
                setLoading(false);
            }
        };

        if (nombre) {
            fetchNuevosClientes();
        }
    }, [timePeriod, sucursal, nombre]);

    return { nuevosClientes, nuevosClientesAnterior, percentageChange, loading, error };
};

export default useNuevosClientes;
