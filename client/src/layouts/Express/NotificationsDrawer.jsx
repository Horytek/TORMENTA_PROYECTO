import { useEffect, useState } from "react";
import { X, Bell, ChevronDown } from "lucide-react"; // Removed unused icons
import { getNotifications, markNotificationsAsRead } from "@/services/express.services";
import { toast } from "react-hot-toast";

export const NotificationsDrawer = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [isClosing, setIsClosing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Auto-refresh notifications when open
    useEffect(() => {
        if (isOpen) {
            loadNotifications();
            setIsClosing(false);
        }
    }, [isOpen]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const data = await getNotifications();
            // data = { notifications: [], unreadCount: 0 }
            setNotifications(data.notifications || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async () => {
        try {
            await markNotificationsAsRead('all');
            toast.success("Notificaciones marcadas como leídas");
            loadNotifications();
        } catch (e) {
            toast.error("Error al actualizar");
        }
    };

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300); // Wait for animation
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop (Light dim only) */}
            <div
                className={`fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
                onClick={handleClose}
            />

            {/* Floating Panel / Bottom Sheet */}
            <div
                className={`fixed z-50 flex flex-col bg-zinc-950 border border-white/10 shadow-2xl transition-all duration-300 ease-in-out
                ${isClosing ? 'translate-y-[120%] opacity-0' : 'translate-y-0 opacity-100'}
                
                /* Mobile: Bottom Sheet */
                bottom-0 left-0 right-0 rounded-t-3xl border-b-0
                
                /* Desktop: Floating Panel Bottom Right */
                md:bottom-24 md:right-4 md:left-auto md:w-[380px] md:rounded-2xl md:border
            `}
            >
                {/* Drag Handle (Mobile) */}
                <div
                    className="w-full flex justify-center pt-3 pb-1 md:hidden cursor-pointer active:opacity-50"
                    onClick={handleClose}
                >
                    <div className="w-12 h-1.5 bg-zinc-800 rounded-full" />
                </div>

                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Bell className="w-5 h-5 text-white" />
                            {notifications.some(n => !n.read_status) && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            )}
                        </div>
                        <h2 className="text-lg font-bold text-white">Notificaciones</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                        <ChevronDown size={20} className="md:hidden" />
                        <X size={18} className="hidden md:block" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[60vh] md:max-h-[400px] scrollbar-hide">
                    {loading ? (
                        <div className="py-8 flex justify-center text-zinc-600">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="py-8 flex flex-col items-center justify-center text-zinc-600 gap-3">
                            <Bell size={32} className="opacity-20" />
                            <p className="text-sm">Sin notificaciones</p>
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div key={n.id} className={`p-3 rounded-xl border transition-colors cursor-pointer group flex gap-3 ${!n.read_status ? 'bg-zinc-900 border-emerald-500/20' : 'bg-transparent border-white/5 opacity-60 hover:opacity-100'}`}>
                                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 
                                    ${n.type === 'warning' || n.type === 'stock' ? 'bg-amber-500' :
                                        n.type === 'error' ? 'bg-red-500' :
                                            n.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`font-semibold text-sm group-hover:text-white truncate pr-2 ${!n.read_status ? 'text-white' : 'text-zinc-400'}`}>
                                            {n.type === 'stock' ? 'Alerta de Stock' : 'Sistema'}
                                        </h3>
                                        <span className="text-[10px] text-zinc-600 whitespace-nowrap">
                                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-400 mt-0.5 max-w-full break-words">{n.message}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-white/5 bg-zinc-950/50 rounded-b-3xl md:rounded-b-2xl">
                    <button
                        onClick={handleMarkRead}
                        className="w-full py-2.5 rounded-lg bg-zinc-900 text-zinc-400 text-xs font-medium hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                        Marcar todo como leído
                    </button>
                </div>
            </div>
        </>
    );
};
