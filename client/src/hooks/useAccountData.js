import { useState, useEffect, useRef } from "react";
import { useUserStore } from "@/store/useStore";
import { getEmpresaDataByUser } from "@/services/empresa.services";
import { getFunciones } from "@/services/funciones.services";
import { getPlanes } from "@/services/planes.services";
import { getUsuario } from "@/services/usuario.services";

// Cache global simple para evitar recargas redundantes durante la sesión
const cache = {
    empresa: null,
    funciones: null,
    planes: null,
    lastNombre: null,
    lastPlanPago: null,
    timestamp: 0
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function useAccountData({ open }) {
    const user = useUserStore(s => s.user);
    const plan_pago = useUserStore(s => s.plan_pago);
    const nombre = useUserStore(s => s.nombre);

    const [data, setData] = useState({
        empresa: cache.empresa,
        funciones: cache.funciones || [],
        planes: cache.planes || [],
        funcionesPlan: [],
        fechaPago: null
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const reloadRef = useRef(false);

    const reload = () => {
        reloadRef.current = true;
        fetchData();
    };

    const fetchData = async () => {
        if (!open || !nombre) return;

        const now = Date.now();
        const isCacheValid =
            cache.empresa &&
            cache.lastNombre === nombre &&
            (now - cache.timestamp < CACHE_DURATION);

        const needsReload =
            reloadRef.current ||
            !isCacheValid ||
            cache.lastPlanPago !== plan_pago;

        if (!needsReload) {
            // Si el cache es válido, solo actualizamos funcionesPlan si cambió el plan
            if (cache.planes) {
                const planObj = cache.planes.find(p => String(p.id_plan) === String(plan_pago));
                const ids = planObj?.funciones ? planObj.funciones.split(",").map(n => Number(n)) : [];

                setData(prev => ({
                    ...prev,
                    empresa: cache.empresa,
                    funciones: cache.funciones,
                    planes: cache.planes,
                    funcionesPlan: ids
                }));
            }
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Fetch empresa
            let empresaData = cache.empresa;
            if (reloadRef.current || !isCacheValid) {
                empresaData = await getEmpresaDataByUser(nombre);
                cache.empresa = empresaData;
                cache.lastNombre = nombre;
                cache.timestamp = now;
            }

            // Fetch funciones y planes (paralelo)
            let funciones = cache.funciones;
            let planes = cache.planes;

            if (!funciones || !planes || reloadRef.current) {
                const [fData, pData] = await Promise.all([getFunciones(), getPlanes()]);
                funciones = fData || [];
                planes = pData || [];
                cache.funciones = funciones;
                cache.planes = planes;
            }

            // Calcular funciones del plan actual
            const planObj = planes.find(p => String(p.id_plan) === String(plan_pago));
            const funcionesPlan = planObj?.funciones ? planObj.funciones.split(",").map(n => Number(n)) : [];
            cache.lastPlanPago = plan_pago;

            // Fetch fecha pago (siempre intentamos refrescar esto o usar el del usuario)
            let fechaPago = null;
            try {
                const src = user?.original;
                if (Array.isArray(src)) fechaPago = src[0]?.fecha_pago;
                else fechaPago = src?.fecha_pago || user?.fecha_pago || null;

                if (!fechaPago && user?.id) {
                    const u = await getUsuario(user.id);
                    fechaPago = Array.isArray(u) ? u[0]?.fecha_pago : u?.fecha_pago;
                }
            } catch (e) {
                console.warn("Error fetching fecha pago", e);
            }

            setData({
                empresa: empresaData,
                funciones,
                planes,
                funcionesPlan,
                fechaPago
            });

            reloadRef.current = false;
        } catch (err) {
            console.error("Error loading account data", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [open, nombre, plan_pago, user?.id]);

    return { data, loading, error, reload };
}
