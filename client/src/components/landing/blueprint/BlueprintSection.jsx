import { motion } from 'framer-motion';
import LivePermissions from './LivePermissions';


const BlueprintSection = ({ isPocketMode }) => {
    return (
        <section className="relative py-24 bg-landing-primary overflow-hidden">
            {/* Background Grid - Blueprint Style */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />
            {/* Seamless Edges - Fade into main background */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#02040a] to-transparent pointer-events-none z-0" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#02040a] to-transparent pointer-events-none z-0" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className={`inline-block px-3 py-1 mb-4 text-xs font-mono font-medium tracking-wider border rounded-full backdrop-blur-sm ${isPocketMode
                            ? 'text-amber-500 border-amber-500/20 bg-amber-500/5'
                            : 'text-landing-accent border-landing-accent/20 bg-landing-accent/5'}`}
                    >
                        {isPocketMode ? 'SIMPLE & RÁPIDO' : 'ARQUITECTURA & SEGURIDAD'}
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl lg:text-4xl font-bold font-manrope text-landing-text-main mb-4"
                    >
                        {isPocketMode ? (
                            <>
                                Todo lo que necesitas.
                                <br />
                                <span className="text-amber-500">Nada que te sobre.</span>
                            </>
                        ) : (
                            <>
                                Diseñado para la confianza.
                                <br />
                                <span className="text-landing-text-muted">Construido para escalar.</span>
                            </>
                        )}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-landing-text-muted text-balance-landing"
                    >
                        {isPocketMode
                            ? "Olvídate de manuales complejos. Pocket está diseñado para que empieces a vender en segundos, no en horas."
                            : "Cada acción queda registrada. Cada usuario tiene solo el acceso que necesita. Una estructura de permisos granular que protege tu negocio desde el núcleo."
                        }
                    </motion.p>
                </div>

                {/* Content switching based on mode */}
                {isPocketMode ? (
                    /* Pocket Mode: Refined Cards per Image 2 */
                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0 }}
                            className="bg-[#0b0c15] rounded-[32px] p-10 flex flex-col items-center text-center border border-white/5 hover:border-amber-500/20 transition-all duration-300 group"
                        >
                            {/* Icon Container - Dark Circle with Amber Icon */}
                            <div className="w-16 h-16 rounded-full bg-[#13151f] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><rect x="7" y="7" width="10" height="10" rx="1" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">Escanea y Vende</h3>
                            <p className="text-gray-400 text-sm leading-relaxed text-balance">
                                Convierte tu cámara en un lector de código de barras profesional. Sin hardware extra.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-[#0b0c15] rounded-[32px] p-10 flex flex-col items-center text-center border border-white/5 hover:border-amber-500/20 transition-all duration-300 group"
                        >
                            <div className="w-16 h-16 rounded-full bg-[#13151f] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">Control de Caja</h3>
                            <p className="text-gray-400 text-sm leading-relaxed text-balance">
                                Arqueos automáticos y precisos. Cierra tu turno con la seguridad de que cada centavo cuadra.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-[#0b0c15] rounded-[32px] p-10 flex flex-col items-center text-center border border-white/5 hover:border-amber-500/20 transition-all duration-300 group"
                        >
                            <div className="w-16 h-16 rounded-full bg-[#13151f] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4">Reportes al Instante</h3>
                            <p className="text-gray-400 text-sm leading-relaxed text-balance">
                                Tus ganancias en tiempo real. Decisiones inteligentes basadas en datos, no en corazonadas.
                            </p>
                        </motion.div>
                    </div>
                ) : (
                    <>
                        {/* Visual Flow / Connection Diagram */}
                        <div className="relative mb-20 hidden lg:block">
                            <div className="flex justify-center items-center gap-8 text-landing-text-muted text-sm font-mono opacity-60">
                                <div className="border border-current px-4 py-2 rounded">EMPRESA</div>
                                <div className="h-px w-8 bg-current"></div>
                                <div className="border border-current px-4 py-2 rounded">SUCURSALES</div>
                                <div className="h-px w-8 bg-current"></div>
                                <div className="border border-landing-accent text-landing-accent px-4 py-2 rounded shadow-[0_0_15px_rgba(0,189,214,0.3)]">ROLES</div>
                                <div className="h-px w-8 bg-current"></div>
                                <div className="border border-current px-4 py-2 rounded">USUARIOS</div>
                            </div>
                        </div>

                        <LivePermissions />
                    </>
                )}
            </div>
        </section>
    );
};

export default BlueprintSection;
