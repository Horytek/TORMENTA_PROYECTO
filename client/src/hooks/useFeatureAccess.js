import { useState, useEffect } from 'react';
import { useAuth } from '@/context/Auth/AuthProvider';
import { getPlanes } from '@/services/planes.services';

export const useFeatureAccess = (featureCode) => {
    const { user } = useAuth();
    const [access, setAccess] = useState({ allowed: false, limit: null, loading: true });

    useEffect(() => {
        const checkAccess = async () => {
            if (!user || !user.plan_pago) {
                setAccess({ allowed: false, limit: null, loading: false });
                return;
            }

            try {
                // Optimization: In a real app, this should be a specific endpoint or cached in a store
                // For now, we fetch all plans to find the user's plan features
                const plans = await getPlanes();
                const myPlan = plans.find(p => p.id_plan === user.plan_pago);

                if (!myPlan || !myPlan.funciones_detalles) {
                    setAccess({ allowed: false, limit: null, loading: false });
                    return;
                }

                const feature = myPlan.funciones_detalles.find(f => f.codigo === featureCode);

                if (!feature) {
                    // Feature not assigned to plan -> Blocked
                    setAccess({ allowed: false, limit: null, loading: false });
                    return;
                }

                // Logic based on assignment & value
                // Note: The controller returns 'valor' as string. 
                // If it's boolean type, 'true' means allowed.
                // If it's numeric, having the feature usually means allowed, with a limit.
                const isAllowed = feature.tipo_valor === 'boolean'
                    ? feature.valor === 'true'
                    : true; // numeric features are allowed if they exist, limit is extra info

                setAccess({
                    allowed: isAllowed,
                    limit: feature.tipo_valor === 'numeric' ? Number(feature.valor) : null,
                    loading: false
                });

            } catch (error) {
                console.error("Error checking feature access:", error);
                setAccess({ allowed: false, limit: null, loading: false });
            }
        };

        checkAccess();
    }, [user, featureCode]);

    return access;
};
