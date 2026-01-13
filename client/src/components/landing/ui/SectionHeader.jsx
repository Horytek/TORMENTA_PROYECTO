import React from 'react';
import { motion } from 'framer-motion';

export const SectionHeader = ({ title, subtitle, badge, className }) => {
    return (
        <div className={`text-center mb-16 md:mb-24 ${className || ''}`}>
            {badge && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 mb-6"
                >
                    <div className="h-8 px-4 rounded-full bg-[var(--premium-glass)] border border-[var(--premium-border)] backdrop-blur-md flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--premium-accent)] animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest text-[var(--premium-muted)]">
                            {badge}
                        </span>
                    </div>
                </motion.div>
            )}

            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 tracking-tight mb-6"
            >
                {title}
            </motion.h2>

            {subtitle && (
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-lg md:text-xl text-[var(--premium-muted)] max-w-2xl mx-auto leading-relaxed"
                >
                    {subtitle}
                </motion.p>
            )}

            {/* Decorative center line */}
            <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="h-px w-24 bg-gradient-to-r from-transparent via-[var(--premium-border)] to-transparent mx-auto mt-8"
            />
        </div>
    );
};
