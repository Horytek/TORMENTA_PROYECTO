import { motion } from 'framer-motion';
import LivePermissions from './LivePermissions';

const BlueprintSection = () => {
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
                        className="inline-block px-3 py-1 mb-4 text-xs font-mono font-medium tracking-wider text-landing-accent border border-landing-accent/20 rounded-full bg-landing-accent/5 backdrop-blur-sm"
                    >
                        ARQUITECTURA & SEGURIDAD
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl lg:text-4xl font-bold font-manrope text-landing-text-main mb-4"
                    >
                        Diseñado para la confianza.
                        <br />
                        <span className="text-landing-text-muted">Construido para escalar.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-landing-text-muted text-balance-landing"
                    >
                        Cada acción queda registrada. Cada usuario tiene solo el acceso que necesita.
                        Una estructura de permisos granular que protege tu negocio desde el núcleo.
                    </motion.p>
                </div>

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
            </div>
        </section>
    );
};

export default BlueprintSection;
