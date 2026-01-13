import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Check, X, User, Lock, Eye, Edit, Trash } from 'lucide-react';

const roles = [
    {
        id: 'sales',
        label: 'Vendedor',
        description: 'Acceso limitado a punto de venta y catálogo.',
        icon: User
    },
    {
        id: 'warehouse',
        label: 'Almacenero',
        description: 'Control de stock, ingresos y kardex.',
        icon: Shield // Using Shield temporarily or another icon if available
    },
    {
        id: 'admin',
        label: 'Admin Global',
        description: 'Control total del sistema y usuarios.',
        icon: Lock
    }
];

const initialPermissions = [
    { id: 'pos', label: 'Punto de Venta' },
    { id: 'inventory', label: 'Inventario Global' },
    { id: 'kardex', label: 'Kardex Valorizado' },
    { id: 'clients', label: 'Gestión de Clientes' },
    { id: 'audit', label: 'Auditoría' }
];

const accessMatrix = {
    sales: { pos: ['create', 'read'], inventory: ['read'], kardex: [], clients: ['create', 'read'], audit: [] },
    warehouse: { pos: [], inventory: ['create', 'read', 'update'], kardex: ['read', 'export'], clients: [], audit: ['read'] },
    admin: { pos: ['create', 'read', 'delete'], inventory: ['create', 'read', 'update', 'delete'], kardex: ['create', 'read', 'export'], clients: ['create', 'read', 'update', 'delete'], audit: ['read'] }
};

const actionIcons = {
    create: { icon: Edit, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    read: { icon: Eye, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    update: { icon: Edit, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    delete: { icon: Trash, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    export: { icon: Check, color: 'text-purple-400', bg: 'bg-purple-500/10' }
};

const LivePermissions = () => {
    const [activeRole, setActiveRole] = useState('sales');
    const [auditLog, setAuditLog] = useState([
        { id: 1, action: 'SYSTEM_INIT', time: '10:00:00', status: 'OK' }
    ]);

    // Fake "Live" Audit Log Effect
    useEffect(() => {
        const interval = setInterval(() => {
            const actions = ['ACCESS_CHECK', 'READ_DATA', 'UPDATE_CACHE', 'SYNC_NODE', 'VERIFY_TOKEN'];
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            const now = new Date();
            const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

            setAuditLog(prev => {
                const newLog = [...prev, { id: Date.now(), action: randomAction, time: timeString, status: 'OK' }];
                return newLog.slice(-5); // Keep last 5
            });
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    // Update logic when role changes
    const handleRoleChange = (roleId) => {
        setActiveRole(roleId);
        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        // Inject a specific log entry
        setAuditLog(prev => [...prev, { id: Date.now(), action: `SWITCH_ROLE_${roleId.toUpperCase()}`, time: timeString, status: 'AUTH' }].slice(-5));
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-6">
            <div className="grid lg:grid-cols-12 gap-8">
                {/* Role Selector */}
                <div className="lg:col-span-4 space-y-4">
                    <h3 className="text-white font-manrope font-semibold text-lg mb-4 flex items-center gap-2">
                        <Lock size={18} className="text-landing-accent" />
                        Roles & Perfiles
                    </h3>
                    {roles.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => handleRoleChange(role.id)}
                            className={`w-full text-left p-4 rounded-xl border transition-all duration-300 relative overflow-hidden group ${activeRole === role.id
                                ? 'bg-landing-blueprint-bg border-landing-accent/50 shadow-lg shadow-landing-accent/10'
                                : 'bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10'
                                }`}
                        >
                            <div className="relative z-10 flex items-start gap-4">
                                <div className={`p-2 rounded-lg transition-colors ${activeRole === role.id ? 'bg-landing-accent text-landing-primary' : 'bg-white/10 text-gray-400'}`}>
                                    <role.icon size={20} />
                                </div>
                                <div>
                                    <div className={`font-semibold transition-colors ${activeRole === role.id ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                                        {role.label}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                                        {role.description}
                                    </div>
                                </div>
                            </div>
                            {activeRole === role.id && (
                                <motion.div
                                    layoutId="activeRoleGlow"
                                    className="absolute inset-0 bg-gradient-to-r from-landing-accent/5 to-transparent z-0"
                                />
                            )}
                        </button>
                    ))}

                    {/* New "Audit Log" Mini Widget */}
                    <div className="mt-8 p-4 rounded-lg bg-black/40 border border-white/5 font-mono text-[10px] text-gray-500">
                        <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-1">
                            <span>LIVE AUDIT LOG</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <div className="space-y-1 relative min-h-[100px]">
                            <AnimatePresence mode='popLayout'>
                                {auditLog.map(log => (
                                    <motion.div
                                        layout
                                        key={log.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }} // Exit to right for variation
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        className="flex justify-between"
                                    >
                                        <span>[{log.time}] {log.action}</span>
                                        <span className="text-emerald-500">{log.status}</span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Permissions Visualizer */}
                <div className="lg:col-span-8 bg-gradient-to-br from-[#0f121a]/50 to-transparent backdrop-blur-md rounded-2xl border border-dashed border-white/10 p-6 relative overflow-hidden group">
                    {/* Vignette for Immersion */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#02040a]/20 to-[#02040a]/80 pointer-events-none z-10" />

                    {/* Blueprint Grid Background - Extremely subtle */}
                    <div className="absolute inset-0 z-0 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500"
                        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                    />

                    <div className="relative z-10">
                        <h3 className="text-white font-manrope font-semibold text-lg mb-6 flex items-center justify-between">
                            <span>Matriz de Acceso</span>
                            <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded text-landing-accent border border-white/5">
                                {activeRole.toUpperCase()}_POLICY
                            </span>
                        </h3>

                        <div className="space-y-3">
                            {initialPermissions.map((perm) => {
                                const rolePerms = accessMatrix[activeRole][perm.id] || [];
                                const hasAccess = rolePerms.length > 0;

                                return (
                                    <motion.div
                                        key={perm.id}
                                        initial={false}
                                        animate={{
                                            borderColor: hasAccess ? 'rgba(0, 189, 214, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                                            backgroundColor: hasAccess ? 'rgba(0, 189, 214, 0.05)' : 'rgba(255, 255, 255, 0.02)'
                                        }}
                                        className="backdrop-blur-sm border rounded-lg p-4 flex items-center justify-between transition-colors duration-300"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${hasAccess ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-gray-700'}`} />
                                            <span className={`text-sm font-medium transition-colors duration-300 ${hasAccess ? 'text-white' : 'text-gray-500'}`}>
                                                {perm.label}
                                            </span>
                                        </div>

                                        <div className="flex gap-2">
                                            {rolePerms.length > 0 ? (
                                                rolePerms.map((action) => {
                                                    const ActionIcon = actionIcons[action]?.icon || Check;
                                                    return (
                                                        <motion.div
                                                            key={action}
                                                            initial={{ scale: 0, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            className={`p-1.5 rounded-md ${actionIcons[action]?.bg} ${actionIcons[action]?.color} flex items-center gap-1.5`}
                                                            title={action}
                                                        >
                                                            <ActionIcon size={14} />
                                                            <span className="text-[10px] uppercase font-bold tracking-wider hidden sm:inline">{action}</span>
                                                        </motion.div>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-xs text-gray-500 italic flex items-center gap-1 opacity-50">
                                                    <Lock size={12} /> Sin acceso
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Simulated Log */}
                        <div className="mt-8 pt-6 border-t border-landing-secondary-foreground/10">
                            <div className="text-xs text-landing-text-muted font-mono mb-2 opacity-70">Audit Log (Live)</div>
                            <div className="space-y-1 font-mono text-xs">
                                <motion.div
                                    key={activeRole + '-log1'}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-emerald-400/80"
                                >
                                    {`> [${new Date().toLocaleTimeString()}] Policy updated: applied role '${activeRole}'`}
                                </motion.div>
                                <motion.div
                                    key={activeRole + '-log2'}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-landing-text-muted/60"
                                >
                                    {`> Permissions calculated: ${accessMatrix[activeRole].inventory.length > 0 ? 'FULL_ACCESS' : 'RESTRICTED_MODE'}`}
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LivePermissions;
