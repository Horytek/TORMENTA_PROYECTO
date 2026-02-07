import { motion } from 'framer-motion';

const CaseStudy = ({ isPocketMode }) => {
    return (
        <section className="py-24 bg-[#02040a] text-white relative overflow-hidden">
            <div className="container mx-auto px-4 max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="grid lg:grid-cols-2 gap-16 items-center"
                >
                    {/* Metrics Column */}
                    <div className="space-y-12">
                        <div>
                            <div className="text-emerald-400 text-sm font-bold tracking-widest uppercase mb-2 font-mono flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                {isPocketMode ? "Rendimiento Instantáneo" : "Rendimiento Comprobado"}
                            </div>
                            <h3 className="text-4xl lg:text-5xl font-bold font-manrope leading-tight text-balance text-white">
                                {isPocketMode ? "Velocidad para tu día a día." : "Arquitectura diseñada para velocidad y escala."}
                            </h3>
                            <p className="mt-6 text-gray-400 text-lg leading-relaxed">
                                {isPocketMode
                                    ? "Tus clientes no esperan. Horytek Pocket carga al instante, funciona aunque falle tu internet y asegura que nunca pierdas una venta."
                                    : "Olvida las cargas lentas. Nuestra infraestructura basada en WebSockets y caché inteligente garantiza que tu operación nunca se detenga."
                                }
                            </p>
                        </div>

                        {/* Stats Cards - Shared Structure but tailored text */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 rounded-2xl bg-[#0f121a] border border-white/5 hover:border-landing-accent/30 transition-colors group">
                                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-mono">Latencia de Red</div>
                                <div className="text-4xl lg:text-5xl font-bold font-manrope text-white group-hover:text-landing-accent transition-colors">
                                    &lt;100ms
                                </div>
                                <div className="text-xs text-emerald-400 mt-3 font-medium bg-emerald-400/10 inline-flex items-center gap-1 px-2 py-1 rounded border border-emerald-400/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Tiempo Real
                                </div>
                            </div>
                            <div className="p-6 rounded-2xl bg-[#0f121a] border border-white/5 hover:border-landing-accent/30 transition-colors group">
                                <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-mono">Disponibilidad</div>
                                <div className="text-4xl lg:text-5xl font-bold font-manrope text-white group-hover:text-landing-accent transition-colors">
                                    99.9%
                                </div>
                                <div className="text-xs text-purple-400 mt-3 font-medium bg-purple-400/10 inline-flex items-center gap-1 px-2 py-1 rounded border border-purple-400/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> SLA Garantizado
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Visual Column */}
                    <div className="relative p-8 rounded-3xl bg-[#0b0c15] border border-white/5 overflow-hidden min-h-[400px] flex flex-col justify-center">
                        {/* Background Grid */}
                        <div className="absolute inset-0 opacity-[0.03]"
                            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}
                        />

                        {/* Pocket Mode Visual: Tech Stack Cards (Matching Screenshot but with Previous Icons) */}
                        <div className="relative z-10 space-y-4">
                            {/* Card 1: Database */}
                            <div className="flex items-center gap-5 p-5 rounded-2xl bg-[#13151f] border border-white/5 shadow-lg group">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/10">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>
                                </div>
                                <div>
                                    <div className="text-white font-bold text-lg tracking-tight">Base de Datos Distribuida</div>
                                    <div className="text-sm text-gray-500 font-medium">Node.js + MySQL Cluster</div>
                                </div>
                                <div className="ml-auto text-[10px] font-bold tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 uppercase">
                                    Active
                                </div>
                            </div>

                            {/* Card 2: Sync Engine - Reverted to 'Sun/Burst' Icon */}
                            <div className="flex items-center gap-5 p-5 rounded-2xl bg-[#13151f] border border-white/5 shadow-lg group">
                                <div className="w-12 h-12 rounded-xl bg-white/5 text-white flex items-center justify-center border border-white/10">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin-slow"><path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m4.9 19.1 2.9-2.9" /><path d="M2 12h4" /><path d="m4.9 4.9 2.9 2.9" /></svg>
                                </div>
                                <div>
                                    <div className="text-white font-bold text-lg tracking-tight">Motor de Sincronización</div>
                                    <div className="text-sm text-gray-500 font-medium">WebSockets (Socket.io)</div>
                                </div>
                                <div className="ml-auto text-[10px] font-bold tracking-widest text-white bg-white/10 px-2 py-1 rounded border border-white/20 uppercase">
                                    Live
                                </div>
                            </div>

                            {/* Card 3: Interface - Reverted to 'Layout/Sidebar' Icon */}
                            <div className="flex items-center gap-5 p-5 rounded-2xl bg-[#13151f] border border-white/5 shadow-lg group">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/10">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" /><path d="m15 9 2.5 2.5-2.5 2.5" /><path d="m9 9-2.5 2.5 2.5 2.5" /></svg>
                                </div>
                                <div>
                                    <div className="text-white font-bold text-lg tracking-tight">Interfaz Reactiva</div>
                                    <div className="text-sm text-gray-500 font-medium">React + Vite + Framer Motion</div>
                                </div>
                                <div className="ml-auto text-[10px] font-bold tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 uppercase">
                                    Optimized
                                </div>
                            </div>
                        </div>

                        {/* Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-landing-accent/10 blur-[80px] rounded-full pointer-events-none" />
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default CaseStudy;
