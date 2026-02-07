import { useState, useEffect } from "react";
import { Button } from "@heroui/react";
import { Check, Star, Shield, Zap, AlertTriangle } from "lucide-react";
import { getPlansRequest, getSubscriptionStatusRequest, subscribeToPlanRequest } from "../../services/subscription.services";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const PlanCard = ({ plan, currentPlan, onSubscribe, loading }) => {
    const isCurrent = currentPlan === plan.name;

    return (
        <div className={`relative p-6 rounded-3xl border ${isCurrent ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 bg-zinc-900/50'} flex flex-col gap-4 hover:scale-[1.02] transition-all duration-300`}>
            {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 rounded-full text-[10px] font-bold text-black uppercase tracking-wider">
                    Plan Actual
                </div>
            )}

            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <p className="text-xs text-zinc-400">{plan.duration_days} días de acceso</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    {plan.duration_days === 1 ? <Zap className="w-5 h-5 text-yellow-400" /> :
                        plan.duration_days === 7 ? <Star className="w-5 h-5 text-blue-400" /> :
                            <Shield className="w-5 h-5 text-purple-400" />}
                </div>
            </div>

            <div className="flex items-end gap-1">
                <span className="text-3xl font-black text-white tracking-tighter">S/. {plan.price}</span>
                <span className="text-xs text-zinc-500 mb-1">/periodo</span>
            </div>

            <div className="h-px w-full bg-white/5" />

            <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>Acceso completo a Express</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>Gestión de Inventario y Ventas</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>Reportes básicos</span>
                </div>
            </div>

            <Button
                className={`w-full font-bold ${isCurrent ? 'bg-zinc-800 text-zinc-400' : 'bg-white text-black hover:bg-zinc-200'}`}
                isDisabled={isCurrent || loading}
                isLoading={loading}
                onPress={() => onSubscribe(plan.id)}
            >
                {isCurrent ? "Activo" : "Suscribirse"}
            </Button>
        </div>
    );
};

export const ExpressSubscription = () => {
    const [plans, setPlans] = useState([]);
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [plansRes, statusRes] = await Promise.all([
                getPlansRequest(),
                getSubscriptionStatusRequest()
            ]);
            setPlans(plansRes);
            setStatus(statusRes);
        } catch (error) {
            toast.error("Error cargando suscripciones");
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (planId) => {
        setPurchasing(true);
        try {
            // Simulate Payment Delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            await subscribeToPlanRequest(planId);
            toast.success("¡Suscripción actualizada con éxito!");
            await fetchData();
        } catch (error) {
            toast.error("Error procesando suscripción");
        } finally {
            setPurchasing(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm("¿Estás seguro de cancelar tu plan Express? Perderás acceso al finalizar el periodo.")) return;
        toast.loading("Cancelando...");
        try {
            // Placeholder for cancel logic
            // await cancelSubscriptionRequest(); 
            // For now, just show toast as backend endpoint is wip
            setTimeout(() => {
                toast.dismiss();
                toast.success("Solicitud de cancelación enviada.");
            }, 1000);
        } catch (e) { toast.error("Error al cancelar"); }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Cargando planes...</div>;

    // Logic: Identify current plan
    // Map DB Plan Names to User Friendly Names if needed
    const currentPlanName = status?.plan === 'Mensual' ? 'Express' : status?.plan;
    const isExpressPlan = currentPlanName === 'Express';

    return (
        <div className="min-h-screen bg-black text-white p-6 pb-24">
            {/* Header */}
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-2xl font-black tracking-tight">Planes y Suscripción</h1>
                <p className="text-zinc-400 text-sm">Elige el plan que mejor se adapte a tu negocio.</p>
            </div>

            {/* Status Banner */}
            {status && (
                <div className={`p-4 rounded-2xl border ${status.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'} mb-8 flex items-center justify-between`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.status === 'active' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                            {status.status === 'active' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-70">Estado Actual</p>
                            <div className="flex items-center gap-2">
                                <p className="font-bold text-lg capitalize">{status.status === 'active' ? 'Activo' : 'Vencido'}</p>
                                <span className="text-sm text-zinc-400">({currentPlanName})</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold uppercase tracking-wider opacity-70">Días Restantes</p>
                        <p className="font-mono text-xl font-bold">{String(status.daysRemaining)}</p>
                    </div>
                </div>
            )}

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map(plan => {
                    const planName = plan.name === 'Mensual' ? 'Express' : plan.name;
                    const isCurrent = status?.plan === plan.name || (status?.plan === 'Express' && plan.name === 'Mensual');

                    // Logic: 
                    // If current is Express (Mensual), disable all other subscribe buttons.
                    // If current is Week/Day, allow switching.

                    let isDisabled = isCurrent || loading;
                    let buttonText = isCurrent ? "Tu Plan Actual" : "Cambiar a este plan";

                    if (isExpressPlan && !isCurrent) {
                        isDisabled = true;
                        buttonText = "Plan Express Activo";
                    }

                    return (
                        <div key={plan.id} className={`relative p-6 rounded-3xl border ${isCurrent ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 bg-zinc-900/50'} flex flex-col gap-4 hover:scale-[1.02] transition-all duration-300`}>
                            {isCurrent && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 rounded-full text-[10px] font-bold text-black uppercase tracking-wider">
                                    Plan Actual
                                </div>
                            )}

                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{planName}</h3>
                                    <p className="text-xs text-zinc-400">{plan.duration_days} días de acceso</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                    {plan.duration_days === 1 ? <Zap className="w-5 h-5 text-yellow-400" /> :
                                        plan.duration_days === 7 ? <Star className="w-5 h-5 text-blue-400" /> :
                                            <Shield className="w-5 h-5 text-purple-400" />}
                                </div>
                            </div>

                            <div className="flex items-end gap-1">
                                <span className="text-3xl font-black text-white tracking-tighter">S/. {plan.price}</span>
                                <span className="text-xs text-zinc-500 mb-1">/periodo</span>
                            </div>

                            <div className="h-px w-full bg-white/5" />

                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2 text-xs text-zinc-300">
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span>Acceso completo a Express</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-300">
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span>Gestión de Inventario y Ventas</span>
                                </div>
                            </div>

                            <Button
                                className={`w-full font-bold ${isCurrent ? 'bg-zinc-800 text-zinc-400' : 'bg-white text-black hover:bg-zinc-200'}`}
                                isDisabled={isDisabled}
                                isLoading={purchasing}
                                onPress={() => onSubscribe(plan.id)}
                            >
                                {buttonText}
                            </Button>
                        </div>
                    );
                })}
            </div>

            {/* Cancel Button for Express Plan */}
            {isExpressPlan && (
                <div className="mt-8 flex flex-col items-center gap-4 border-t border-white/5 pt-8">
                    <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl max-w-md text-center">
                        <p className="text-sm text-red-400 mb-4">
                            Estás en el <strong>Plan Express</strong> (Mensual). Para cambiar de plan, primero debes cancelar tu suscripción actual o esperar a que finalice el periodo.
                        </p>
                        <Button
                            color="danger"
                            variant="flat"
                            onPress={handleCancel}
                            className="font-bold"
                        >
                            Cancelar Suscripción
                        </Button>
                    </div>
                </div>
            )}

            <div className="mt-8 flex justify-center">
                <Button
                    variant="flat"
                    className="text-zinc-500"
                    onPress={() => navigate('/express/dashboard')}
                >
                    Volver al Dashboard
                </Button>
            </div>
        </div>
    );
};
export default ExpressSubscription;
