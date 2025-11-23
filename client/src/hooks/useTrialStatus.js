import { useState, useEffect } from "react";
import axios from "@/api/axios";
import { updateUsuario } from "@/services/usuario.services";

export function useTrialStatus({ open, fechaPago, user }) {
    const [trialInfo, setTrialInfo] = useState({
        isTrial: false,
        daysLeft: 0,
        trialEnd: null,
        extended: false,
        readyForProd: false,
        loading: true
    });

    useEffect(() => {
        if (!open) return;

        let ignore = false;
        const MS_DAY = 86400000;
        const fmt = d => d.toISOString().slice(0, 10);

        const evalTrial = async () => {
            // Reset state to loading initially if needed, or keep previous
            // setTrialInfo(prev => ({ ...prev, loading: true }));

            if (!fechaPago) {
                if (!ignore) {
                    setTrialInfo({ isTrial: false, daysLeft: 0, trialEnd: null, extended: false, readyForProd: true, loading: false });
                    if (user?.id) try { await updateUsuario(user.id, { estado_prueba: 0 }); } catch { }
                }
                return;
            }

            const fp = new Date(fechaPago);
            if (Number.isNaN(fp.getTime())) {
                if (!ignore) {
                    setTrialInfo({ isTrial: false, daysLeft: 0, trialEnd: null, extended: false, readyForProd: true, loading: false });
                    if (user?.id) try { await updateUsuario(user.id, { estado_prueba: 0 }); } catch { }
                }
                return;
            }

            const trialStart = new Date(fp);
            trialStart.setMonth(trialStart.getMonth() - 1);
            let trialEnd = new Date(trialStart);
            trialEnd.setDate(trialEnd.getDate() + 7);

            const today = new Date();

            // Optimización: Ejecutar peticiones en paralelo
            let ventasCount = 0;
            let productosCount = 0;

            try {
                const [resV, resK] = await Promise.all([
                    axios.get("/reporte/registro_ventas_sunat", {
                        params: { startDate: fmt(trialStart), endDate: fmt(today) }
                    }).catch(() => ({ data: { data: [] } })),
                    axios.get("/kardex").catch(() => ({ data: { data: [] } }))
                ]);

                const rows = Array.isArray(resV?.data?.data) ? resV.data.data : [];
                ventasCount = rows.length;

                const items = Array.isArray(resK?.data?.data) ? resK.data.data : [];
                productosCount = items.length;
            } catch (e) {
                console.error("Error checking trial status", e);
            }

            const readyForProd = ventasCount > 0 && productosCount > 0;

            let extended = false;
            if (!readyForProd && today > trialEnd) {
                const maxEnd = fp;
                while (today > trialEnd && trialEnd < maxEnd) {
                    const next = new Date(trialEnd);
                    next.setDate(next.getDate() + 7);
                    trialEnd = next <= maxEnd ? next : maxEnd;
                    extended = true;
                }
            }

            const isTrial = !readyForProd && today < trialEnd;
            const daysLeft = Math.max(0, Math.ceil((trialEnd - today) / MS_DAY));

            if (!ignore) {
                setTrialInfo({
                    isTrial,
                    daysLeft,
                    trialEnd: trialEnd.toISOString(),
                    extended,
                    readyForProd,
                    loading: false
                });

                try {
                    if (user?.id) await updateUsuario(user.id, { estado_prueba: isTrial ? 1 : 0 });
                } catch { }
            }
        };

        // Delay execution slightly to allow drawer animation to start smoothly
        const timer = setTimeout(() => {
            evalTrial();
        }, 100);

        return () => {
            ignore = true;
            clearTimeout(timer);
        };
    }, [open, fechaPago, user?.id]);

    return trialInfo;
}
